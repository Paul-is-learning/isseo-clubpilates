-- ============================================================================
-- RPC: patch_studio_data
-- Atomic merge/append/remove on studios.data JSON blob
-- Eliminates read-then-write race conditions for multi-user editing
-- ============================================================================

CREATE OR REPLACE FUNCTION patch_studio_data(
  p_id text,
  p_merge jsonb DEFAULT NULL,
  p_array_field text DEFAULT NULL,
  p_array_append jsonb DEFAULT NULL,
  p_array_remove_key text DEFAULT NULL,
  p_array_remove_val text DEFAULT NULL,
  p_expected_updated_at timestamptz DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _row record;
  _data jsonb;
  _arr jsonb;
  _result jsonb;
BEGIN
  -- Lock the row to prevent concurrent modifications
  SELECT data, updated_at INTO _row
  FROM studios WHERE id = p_id
  FOR UPDATE;

  -- If row doesn't exist, create it
  IF NOT FOUND THEN
    _data := COALESCE(p_merge, '{}'::jsonb);
    IF p_array_field IS NOT NULL AND p_array_append IS NOT NULL THEN
      _data := jsonb_set(_data, ARRAY[p_array_field], p_array_append);
    END IF;
    INSERT INTO studios (id, data, updated_at)
    VALUES (p_id, _data, now());
    RETURN jsonb_build_object('ok', true, 'data', _data);
  END IF;

  _data := COALESCE(_row.data, '{}'::jsonb);

  -- Optimistic lock check (if provided)
  IF p_expected_updated_at IS NOT NULL THEN
    IF _row.updated_at > p_expected_updated_at + interval '1 second' THEN
      RETURN jsonb_build_object(
        'conflict', true,
        'server_updated_at', to_char(_row.updated_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
        'data', _data
      );
    END IF;
  END IF;

  -- MERGE: shallow-merge keys into data
  IF p_merge IS NOT NULL THEN
    _data := _data || p_merge;
  END IF;

  -- ARRAY APPEND: add element(s) to an array field
  IF p_array_field IS NOT NULL AND p_array_append IS NOT NULL THEN
    _arr := COALESCE(_data->p_array_field, '[]'::jsonb);
    -- p_array_append can be a single object or an array
    IF jsonb_typeof(p_array_append) = 'array' THEN
      _arr := _arr || p_array_append;
    ELSE
      _arr := _arr || jsonb_build_array(p_array_append);
    END IF;
    _data := jsonb_set(_data, ARRAY[p_array_field], _arr);
  END IF;

  -- ARRAY REMOVE: remove element(s) from array by key/value match
  IF p_array_field IS NOT NULL AND p_array_remove_key IS NOT NULL AND p_array_remove_val IS NOT NULL THEN
    _arr := COALESCE(_data->p_array_field, '[]'::jsonb);
    SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb) INTO _arr
    FROM jsonb_array_elements(_arr) AS elem
    WHERE elem->>p_array_remove_key IS DISTINCT FROM p_array_remove_val;
    _data := jsonb_set(_data, ARRAY[p_array_field], _arr);
  END IF;

  -- Write back
  UPDATE studios SET data = _data, updated_at = now() WHERE id = p_id;

  RETURN jsonb_build_object('ok', true, 'data', _data);
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION patch_studio_data TO authenticated;
