/**
 * 生成SHA-256摘要
 * https://developer.mozilla.org/zh-CN/docs/Web/API/SubtleCrypto/digest
 * @param {String} message 
 * @returns 
 */
export async function digestMessage(message) {
  const msgUint8 = new TextEncoder().encode(message);                           // 编码为（utf-8）Uint8Array
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);           // 计算消息的哈希值
  const hashArray = Array.from(new Uint8Array(hashBuffer));                     // 将缓冲区转换为字节数组
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join(''); // 将字节数组转换为十六进制字符串
  return hashHex;
}