export function getAssetCapitalCost(asset, gstApplies, capexMult = 1) {
  const cost = (parseFloat(asset.cost) || 0) * capexMult;
  const gstRate = parseFloat(asset.gstRatePct) || 0;
  const isUnclaimable = gstApplies && gstRate > 0 && !asset.itcClaimable;
  return isUnclaimable ? cost * (1 + gstRate / 100) : cost;
}
