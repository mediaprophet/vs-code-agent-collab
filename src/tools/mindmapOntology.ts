import * as fs from 'fs';
import * as path from 'path';

const DATA_PATH = path.join(__dirname, '../../data/mindmap.json');

export async function loadMindMapOntology() {
    if (fs.existsSync(DATA_PATH)) {
        return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
    }
    return {};
}

export async function saveMindMapOntology(mindMap: any) {
    fs.writeFileSync(DATA_PATH, JSON.stringify(mindMap, null, 2), 'utf8');
}
