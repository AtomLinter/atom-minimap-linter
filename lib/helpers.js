'use babel';

/**
 * Given a message, return the associated path, or null if there isn't one
 * @param  {Object} message The message to parse
 * @return {String}         The associated path, or null
 */
export const messagePath = (message) => {
  if (message.filePath) {
    return message.filePath;
  }
  if (message.location && message.location.file) {
    return message.location.file;
  }
  return null;
};

/**
 * Given a message, return the associated range, or null if there isn't one
 * @param  {Object} message The message to parse
 * @return {any}         The associated range, or null
 */
export const messageRange = (message) => {
  if (message.range) {
    return message.range;
  }
  if (message.location && message.location.position) {
    return message.location.position;
  }
  return null;
};

/**
 * Given a message, return the associated severity, defaulting to error
 * @param  {Object} message The message to parse
 * @return {string}         The message severity
 */
export const messageSeverity = (message) => {
  const type = message.type ? message.type.toLowerCase() : '';
  const severity = message.severity ? message.severity : type;
  switch (severity) {
    case 'error':
    case 'warning':
    case 'info':
      return severity;
    default:
      return 'error';
  }
};

/**
 * Check whether a message is related to the given path
 * @param  {Object} message The message to check
 * @param  {string} filePath Path to check the message against
 * @return {boolean}          Whether the message belongs to that path or not
 */
export const goodMessage = (message, filePath) => {
  if (messagePath(message) === filePath) {
    if (messageRange(message)) {
      return true;
    }
  }
  return false;
};
