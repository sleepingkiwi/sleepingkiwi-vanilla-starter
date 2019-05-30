/** main javascript entrypoint
 *  ------------------------------------------------------------------------------------------------
 *  included on every page.
**/


/** importing what we need
 *  ------------------------------------------------------------------------------------------------
 *  assets that are needed on all entry points.
**/
// robots txt
import '../static/root/robots.txt';

// global css
import '../styles/global.scss';


/** Running some script
 *  ------------------------------------------------------------------------------------------------
**/
import { debugLog } from './utils/logging';

debugLog(
  'main',
  'this is a message from the main.js file',
  [
    'you should only see this in dev!',
  ],
);
