function copy_icon_to_order_for(node)
  for k, v in pairs(data.raw[node]) do
    if v.icon and v.order then
      data.raw[node][k].order = v.order .. ';' .. v.icon
    end
  end
end

function copy_icon_to_order()
  copy_icon_to_order_for("item")
  copy_icon_to_order_for("fluid")
  copy_icon_to_order_for("recipe")
  copy_icon_to_order_for("technology")
  copy_icon_to_order_for("item-group")
end
