/c
local dir = "recipe_explorer"

local function unsafe_access_node_key(node, k)
  return node[k]
end

local function unwrap_userdata(node)
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

local table_to_json
local node_to_json

table_to_json = function(node, mandatory_index, ignored_indexes, max_level, level, first, last, is_array)
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

node_to_json = function(node, mandatory_index, ignored_indexes, max_level, level)
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

local game_settings = {
  active_mods = game.active_mods,
  difficulty_settings = {
    recipe_difficulty = game.difficulty_settings.recipe_difficulty,
    technology_difficulty = game.difficulty_settings.technology_difficulty,
    technology_price_multiplier = game.difficulty_settings.technology_price_multiplier
  },
  player = {
    mod_settings = game.player.mod_settings
  }
}

local ignored_indexes = {force=true, prototype=true, subgroups=true, isluaobject=true, valid=true}
local mandatory_index_crafting = 'crafting_categories'

local js = 'const d = {}\n'
js = js .. 'd.game = '
  .. node_to_json(game_settings, nil, ignored_indexes, 2) .. '\n'
js = js .. 'd.game.entity_prototypes = '
  .. node_to_json(game.entity_prototypes, mandatory_index_crafting, ignored_indexes, 2) .. '\n'
js = js .. 'd.game.player.force = {}' .. '\n'
js = js .. 'd.game.player.force.recipes = '
  .. node_to_json(game.player.force.recipes, nil, ignored_indexes, 4) .. '\n'
js = js .. 'd.game.player.force.technologies = '
  .. node_to_json(game.player.force.technologies, nil, ignored_indexes, 2) .. '\n'
js = js .. 'window.factorio_recipe_data = d\n'

game.write_file(dir .. "/factorio_recipe_data.js", js)
