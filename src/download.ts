/**
 * Downloads generated journal content using a temporary browser object URL.
 * @param text File content, already serialized by the caller.
 * @param type MIME type, including charset when needed.
 * @param name Suggested download filename.
 */
export function download(text: string, type: string, name: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
