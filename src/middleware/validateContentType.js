const validateContentType = (type) => (req, res, next) => {
  if (!req.is(type)) {
    return res.status(415).json({
      status: 'fail',
      message: `Content-Type must be ${type}`,
    });
  }
  return next();
};

export default validateContentType;
