/** Javascript specific to the about page.
 *  ------------------------------------------------------------------------------------------------
 *  defined as an entry point in our webpack config
 *  and then included in exported html by HtmlWebpackPlugin
**/


/** importing what we need
 *  ------------------------------------------------------------------------------------------------
 *  assets that are needed on the about page
**/
// global css
import '../../styles/pages/about.scss';


/** Running some script
 *  ------------------------------------------------------------------------------------------------
**/
const p = document.createElement('p');
p.innerHTML = 'this message was appended from the about.js file';
document.querySelector('body').appendChild(p);
