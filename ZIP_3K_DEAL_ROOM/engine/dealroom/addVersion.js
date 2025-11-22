export function addVersion(doc, versionMeta){
  const v = {
    id: 'ver_' + Date.now(),
    ...versionMeta,
    ts: new Date().toISOString()
  };
  doc.versions.push(v);
  return v;
}
