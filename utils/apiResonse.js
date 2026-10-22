const sendResponse = function (
  res,
  success,
  data,
  message,
  statusCode = 200,
  meta = null
) {
  const obj = {
    success,
    data,
    message,
    statusCode,
  };

  if (meta && typeof meta === "object") Object.assign(obj, meta);

  return res.status(statusCode).json(obj);
};

export { sendResponse };
