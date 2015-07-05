/*
 * @package secureLogin
 * @author Sebastian Tschan
 * @copyright (c) Sebastian Tschan
 * @license GNU General Public License
 * @link https://blueimp.net/mozilla/
 */
 
window.addEventListener('load', function() { secureLogin.initialize(); }, false);
window.addEventListener('unload', function() { secureLogin.finalize(); }, false);