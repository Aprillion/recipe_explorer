/c
local dir = "recipe_explorer"

local function unwrap_userdata(node)
  local table = {}
  local help = node.help():gsub('.*Values:', '')
  for k in help:gmatch('%s*([^[]+) %[R[^[]*]') do
    table[k] = node[k]
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
      if i == 1 then
        out = out .. "\n"
      else
        out = out .. ",\n"
      end
      out = out .. string.rep(' ', level * 2)
      if is_array then
        out = out .. node_to_json(v, nil, ignored_indexes, max_level, level)
      else
        out = out .. '"' .. k .. '": '
        if ignored_indexes[k] then
          out = out .. '"<ignored>"'
        else
          local ignored_indexes_next = {}
          for ig_k, ig_v in pairs(ignored_indexes) do
            ignored_indexes_next[ig_k] = ig_v
          end
          ignored_indexes_next[k] = true
          out = out .. node_to_json(v, nil, ignored_indexes_next, max_level, level)
        end
      end
    end
  end
  if i > 0 then
    out = out .. "\n" .. string.rep(' ', (level - 1) * 2)
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
          local success, result = pcall(unwrap_userdata, node)
          if (success) then
            node = result
          else
            node = {["<parsing error>"] = result:gsub('\n.*', '')}
          end
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
game.write_file(dir .. "/game.json", node_to_json(game_settings, nil, {}, 2))

local ignored_indexes = {force=true, prototype=true, group=true, subgroup=true}
game.write_file(dir .. "/game.player.force.recipes.json", node_to_json(game.player.force.recipes, nil, ignored_indexes, 4))
game.write_file(dir .. "/game.player.force.technologies.json", node_to_json(game.player.force.technologies, nil, ignored_indexes, 2))

local mandatory_index = 'crafting_categories'
game.write_file(dir .. "/game.entity_prototypes.json", node_to_json(game.entity_prototypes, mandatory_index, ignored_indexes, 2))
