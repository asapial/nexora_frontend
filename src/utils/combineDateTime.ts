export const combineDateTime = (date: string, time: string) => {
  const d = new Date(`${date}T${time}`);
  if (isNaN(d.getTime())) {
    throw new Error("Invalid date/time");
  }
  return d.toISOString();
};