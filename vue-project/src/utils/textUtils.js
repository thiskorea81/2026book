export const getNeisByteLength = (str) => {
  let byteLength = 0;
  if (!str) return 0;
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i);
    if (charCode <= 0x00007F) byteLength += 1;
    else if (charCode <= 0x0007FF) byteLength += 2;
    else byteLength += 3;
  }
  return byteLength;
};