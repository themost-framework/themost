var Errors = exports.Errors = [{
    statusCode: 400,
    title: "Bad Request",
    message: "The request cannot be fulfilled due to bad syntax."
}, {
    statusCode: 401,
    title: "Unauthorized",
    message: "The request was a legal request, but requires user authentication."
}, {
    statusCode: 403,
    title: "Forbidden",
    message: "The server understood the request, but is refusing to fulfill it."
}, {
    statusCode: 404,
    title: "Not Found",
    message: "The requested resource could not be found but may be available again in the future."
}, {
    statusCode: 405,
    title: "Method Not Allowed",
    message: "A request was made of a resource using a request method not supported by that resource."
}, {
    statusCode: 406,
    title: "Not Acceptable",
    message: "The requested resource is only capable of generating content not acceptable according to the Accept headers sent in the request."
}, {
    statusCode: 407,
    title: "Proxy Authentication Required",
    message: "The client must first authenticate itself with the proxy."
}, {
    statusCode: 408,
    title: "Request Timeout",
    message: "The server timed out waiting for the request."
}, {
    statusCode: 409,
    title: "Conflict",
    message: "The request could not be completed due to a conflict with the current state of the resource."
}, {
    statusCode: 410,
    title: "Gone",
    message: "The resource requested is no longer available and will not be available again."
}, {
    statusCode: 411,
    title: "Length Required",
    message: "The request did not specify the length of its content, which is required by the requested resource."
}, {
    statusCode: 412,
    title: "Precondition Failed",
    message: "The server does not meet one of the preconditions that the requester put on the request."
}, {
    statusCode: 413,
    title: "Request Entity Too Large",
    message: "The request is larger than the server is willing or able to process."
}, {
    statusCode: 414,
    title: "Request-URI Too Long",
    message: "The URI provided was too long for the server to process."
}, {
    statusCode: 415,
    title: "Unsupported Media Type",
    message: "The server is refusing to service the request because the payload is in a format not supported by this method on the target resource."
}, {
    statusCode: 416,
    title: "Requested Range Not Satisfiable",
    message: "The client has asked for a portion of the file, but the server cannot supply that portion."
}, {
    statusCode: 417,
    title: "Expectation Failed",
    message: "The server cannot meet the requirements of the Expect request-header field."
}, {
    statusCode: 496,
    title: "No Cert",
    message: "The client must provide a certificate to fulfill the request."
}, {
    statusCode: 498,
    title: "Token expired",
    message: "Token was expired or is in invalid state."
}, {
    statusCode: 499,
    title: "Token required",
    message: "A token is required to fulfill the request."
}, {
    statusCode: 500,
    title: "Internal Server Error",
    message: "The server encountered an internal error and was unable to complete your request."
}, {
    statusCode: 501,
    title: "Not Implemented",
    message: "The server either does not recognize the request method, or it lacks the ability to fulfil the request."
}, {
    statusCode: 502,
    title: "Bad Gateway",
    message: "The server was acting as a gateway or proxy and received an invalid response from the upstream server."
}, {
    statusCode: 503,
    title: "Service Unavailable",
    message: "The server is currently unavailable (because it is overloaded or down for maintenance)."
}];

if (typeof exports !== 'undefined') {
    module.exports.Errors = Errors;
}