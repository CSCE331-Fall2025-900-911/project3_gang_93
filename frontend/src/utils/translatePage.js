import { translateAPI } from "../services/api";

export function collectTextNodes(node, list = []) {
  if (node.nodeType === Node.TEXT_NODE && node.nodeValue.trim() !== "") {
    list.push(node);
  } else {
    node.childNodes?.forEach(child => collectTextNodes(child, list));
  }
  return list;
}

export async function translatePage(target_lang) {
  const textNodes = collectTextNodes(document.body);
  const texts = textNodes.map(n => n.nodeValue);

  const combined = texts.join("|||");

  const translated = await translateAPI(combined, targetLang);

  const chunks = translated.split("|||");

  textNodes.forEach((node, i) => {
    node.nodeValue = chunks[i] || node.nodeValue;
  });
}