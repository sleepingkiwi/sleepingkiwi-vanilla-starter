/** Logging debug notices in a standard way!
 *  ------------------------------------------------------------------------------------------------
**/


/** debugLog
 *  ------------------------------------------------------------------------------------------------
 *  for logging anything but errors.
 *  logs out a standard start/stop message identifying the source of the debug log.
 *  logs out a string message and then any additional things as required:
 *
    source: String
    message: String
    additional: Array (of anything)
**/
export const debugLog = (source, message, additional = []) => {
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.log(`%c---\ns:debug:${source}`, 'color:#888; font-size:0.8em;');
    // eslint-disable-next-line no-console
    console.log(`%c${message}`, 'color:#666; font-size:0.9em;');
    additional.forEach((log) => {
      // eslint-disable-next-line no-console
      console.log(log);
    });
    // eslint-disable-next-line no-console
    console.log(`%ce:debug:${source}\n---`, 'color:#888; font-size:0.8em;');
  }
};


/** debugLogError
 *  ------------------------------------------------------------------------------------------------
 *  for logging errors.
 *  logs out a standard start/stop message identifying the source of the debug log.
 *  logs out a string message
 *  logs out an Error AS AN ERROR
 *
    source: String
    message: String
    error: Error
**/
export const debugLogError = (source, message, error) => {
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.log(`%c---\ns:debug:error:${source}`, 'color:#f88; font-size:0.8em;');
    // eslint-disable-next-line no-console
    console.log(`%c${message}`, 'color:#f66; font-size:0.9em;');
    // eslint-disable-next-line no-console
    console.error(error);
    // eslint-disable-next-line no-console
    console.log(`%ce:debug:error:${source}\n---`, 'color:#f88; font-size:0.8em;');
  }
};
