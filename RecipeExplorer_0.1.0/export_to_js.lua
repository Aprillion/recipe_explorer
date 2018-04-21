local ignored_indexes = {force=true, prototype=true, subgroups=true, isluaobject=true, valid=true}

function get_player()
  return game.players[1] -- TODO: multiplayer with multiple tech trees
end

function unsafe_access_node_key(node, k)
  return node[k]
end

function unwrap_userdata(node)
  local table = {}
  local help = node.help():gsub('.*Values:', '')
  for k in help:gmatch('%s*([^[]+) %[R[^[]*]') do
    local success, result = pcall(unsafe_access_node_key, node, k)
    if (success) then
      table[k] = result
    else
      table[k] = {["<parsing error>"] = result:gsub('\n.*', '')}
    end
  end
  return table
end

function table_to_json(node, mandatory_index, ignored_indexes, max_level, level, first, last, is_array)
  local out = ''
  local i = 0
  for k, v in pairs(node) do
    local matching_mandatory = true
    if mandatory_index and not v[mandatory_index] then
      matching_mandatory = false
    end
    if matching_mandatory then
      i = i + 1
      if i > 1 and (is_array or not ignored_indexes[k]) then
        out = out .. ", "
      end
      if is_array then
        out = out .. node_to_json(v, nil, ignored_indexes, max_level, level)
      elseif not ignored_indexes[k] then
        out = out .. '"' .. k .. '": '
        if k == 'group' or k == 'subgroup' then
          out = out .. '{"name": "' .. v.name .. '", '
          out = out .. '"order": "' .. v.order .. '"}'
        else
          local ignored_indexes_next = {}
          for ig_k, ig_v in pairs(ignored_indexes) do
            ignored_indexes_next[ig_k] = true
          end
          ignored_indexes_next[k] = true
          out = out .. node_to_json(v, nil, ignored_indexes_next, max_level, level)
        end
      end
    end
  end
  if i > 0 then
  end
  return first .. out .. last
end

function node_to_json(node, mandatory_index, ignored_indexes, max_level, level)
  level = level or 0
  local out = ''
  if type(node) == "table" then
    if #node > 0 then
      out = out .. table_to_json(node, mandatory_index, ignored_indexes, max_level, level + 1, '[', ']', true)
    else
      if node.__self then
        if level <= max_level then
          node = unwrap_userdata(node)
        else
          node = {["<parsing limit reached>"] = max_level}
        end
      end
      out = out .. table_to_json(node, nil, ignored_indexes, max_level, level + 1, '{', '}', false)
    end
  elseif type(node) == "string" then
    out = out .. '"' .. node:gsub('"', '`') .. '"'
  elseif type(node) == "number" then
    out = out .. node
  elseif type(node) == "boolean" then
    out = out .. tostring(node)
  else
    out = out .. '"' .. tostring(node) .. '"'
  end
  return out
end

function export_recipes()
  local game_settings = {
    active_mods = game.active_mods,
    difficulty_settings = {
      recipe_difficulty = game.difficulty_settings.recipe_difficulty,
      technology_difficulty = game.difficulty_settings.technology_difficulty,
      technology_price_multiplier = game.difficulty_settings.technology_price_multiplier
    },
    player = {
      mod_settings = get_player().mod_settings
    }
  }
  
  local js = '// fre = factorio recipe explorer\n'
  js = js .. 'window.fre_game_settings = '
    .. node_to_json(game_settings, nil, ignored_indexes, 2) .. '\n'
  js = js .. 'window.fre_entity_prototypes = '
    .. node_to_json(game.entity_prototypes, 'crafting_categories', ignored_indexes, 2) .. '\n'
  js = js .. 'window.fre_recipes = '
    .. node_to_json(get_player().force.recipes, nil, ignored_indexes, 4) .. '\n'
  
  game.write_file(script.mod_name .. "/recipes.js", js)
end

function export_technologies()
  local js = 'window.fre_technologies = '
    .. node_to_json(get_player().force.technologies, nil, ignored_indexes, 2) .. '\n'
  
  game.write_file(script.mod_name .. "/technologies.js", js)
end
