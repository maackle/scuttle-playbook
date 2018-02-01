
const withException = fn => (err, data) => {
  if (err) { throw new Error(err) }
  else { fn(data) }
}

module.exports = {
  withException
}
