// Functions for ontology metadata management

export function getOntologyMetadata(mindMap) {
  // Example: extract basic metadata from mindMap
  return {
    nodeCount: mindMap.nodes.length,
    edgeCount: mindMap.edges.length,
    types: Array.from(new Set(mindMap.nodes.map(n => n.type))),
    lastModified: new Date().toISOString()
  };
}

export function setOntologyMetadata(mindMap, metadata) {
  // Attach metadata to mindMap (could be extended for more fields)
  mindMap._metadata = metadata;
  return mindMap;
}
