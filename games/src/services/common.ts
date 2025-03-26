
import { getCookie } from "../utils/cookie";
import { hasValue } from "../utils/gameutils";



/**
 * Will return either with uuid(for testing) or with token when returning url
 */
export function getRequiredUrl(liveChatUrl: boolean = false) {

  const url = getWsUrl(liveChatUrl);
  return url;
}

export function isLoginValid() {
  const urlParams = new URLSearchParams(window.location.search);
  let uuid = urlParams.get("uuid");
  return (getCookie('token') !== null || hasValue(uuid))
}

function getWsUrl(liveChatUrl = false) {
  const userData = JSON.parse(localStorage.getItem('user') || 'null');
  const authToken = userData.userData.data.token;
  const userInfo = userData.userData.data.user;
  if (!hasValue(authToken)) {
    return null;
  }

  let url = liveChatUrl
    ? `ws://localhost:8001/api/livechat?token=${authToken}&userInfo=${encodeURIComponent(JSON.stringify(userInfo))}`
    : `ws://localhost:8001/api/websocket?token=${authToken}&userInfo=${encodeURIComponent(JSON.stringify(userInfo))}`;

  // Determine the game based on the pathname
  let game = null;
  let isPlayerInChatSupport = false;
  if (window.location.pathname.includes('/dos-letra')) {
    game = 'dos';
  } else if (window.location.pathname.includes('/zodiac')) {
    game = 'zodiac';
  }else if(window.location.pathname.includes('/live-chat-support')){
    isPlayerInChatSupport = true;
  }

  // Add the game parameter if it has a value
  if (game) {
    url += `&game=${game}`;
  }
  if (isPlayerInChatSupport) {
    url += `&isPlayerInChatSupport=${isPlayerInChatSupport}`;
  }

  return url;
}



