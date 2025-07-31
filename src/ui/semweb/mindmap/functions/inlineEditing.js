// Inline editing helpers for mindmap nodes and edges

export function enableInlineEditing(el, node, onUpdate) {
  el.ondblclick = (e) => {
    e.stopPropagation();
    const input = document.createElement('input');
    input.type = 'text';
    input.value = node.label;
    input.onblur = () => {
      node.label = input.value;
      onUpdate();
    };
    input.onkeydown = (ev) => {
      if (ev.key === 'Enter') input.blur();
    };
    el.innerHTML = '';
    el.appendChild(input);
    input.focus();
  };
}

export function enableTypeEditing(el, node, nodeTypes, onUpdate) {
  el.onclick = (e) => {
    e.stopPropagation();
    const select = document.createElement('select');
    nodeTypes.forEach(type => {
      const opt = document.createElement('option');
      opt.value = type;
      opt.textContent = type;
      if (type === node.type) opt.selected = true;
      select.appendChild(opt);
    });
    select.onchange = () => {
      node.type = select.value;
      onUpdate();
    };
    el.innerHTML = '';
    el.appendChild(select);
    select.focus();
  };
}
