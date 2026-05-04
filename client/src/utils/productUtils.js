export const getFreshnessTag = (harvestDate) => {
  if (!harvestDate) return null;
  const days = Math.floor((Date.now() - new Date(harvestDate)) / 86400000);
  if (days === 0) return { label: 'Harvest Today', days, color: 'text-green-700', bgColor: 'bg-green-100 border-green-300', icon: '🌟' };
  if (days === 1) return { label: '1 Day Old',     days, color: 'text-green-600', bgColor: 'bg-green-50 border-green-200',  icon: '🌿' };
  if (days === 2) return { label: '2 Days Old',    days, color: 'text-yellow-600', bgColor: 'bg-yellow-50 border-yellow-200', icon: '🌾' };
  if (days <= 5)  return { label: `${days} Days Old`, days, color: 'text-orange-500', bgColor: 'bg-orange-50 border-orange-200', icon: '⚠️' };
  return           { label: `${days} Days Old`,    days, color: 'text-red-500',    bgColor: 'bg-red-50 border-red-200',      icon: '🔴' };
};

export const getStockAlert = (stock) => {
  if (stock === 0)  return { label: 'Out of Stock',       color: 'bg-gray-800 text-white' };
  if (stock <= 5)   return { label: `Only ${stock} left!`, color: 'bg-red-500 text-white' };
  if (stock <= 15)  return { label: 'Selling Fast 🔥',    color: 'bg-orange-500 text-white' };
  return null;
};
