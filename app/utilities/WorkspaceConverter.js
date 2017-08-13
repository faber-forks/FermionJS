const PAD_LENGTH = 3;

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/padStart
if (!String.prototype.padStart) {
  String.prototype.padStart = function padStart(targetLength, padString) {
    targetLength >>= 0; // floor if number or convert non-number to 0;
    padString = String(padString || ' ');
    if (this.length > targetLength) {
      return String(this);
    }

    targetLength -= this.length;
    if (targetLength > padString.length) {
      padString += padString.repeat(targetLength / padString.length); // append to original to ensure we are longer than needed
    }
    return padString.slice(0, targetLength) + String(this);
  };
}
const padName = (name, id) => `${name}_${id.padStart(PAD_LENGTH, '0')}`;

class ComponentConverter {
  constructor(component) {
    this.component = component;
  }
  get ext() {
    return '.js';
  }
  get fileName() {
    return padName(this.component.name, this.component.id.toString());
  }
  get id() {
    return this.component.id;
  }
  get name() {
    return this.component.name;
  }
  getImports() {
    return this.component.childrenFileNames.reduce((final, childFile) => {
      final += `import ${childFile} from '../${childFile}/${childFile}'` + '\n';
      return final;
    }, '');
  }
  getChildren() {
    return this.component.childrenFileNames.reduce((final, childFile, i, array) => {
      final += `<${childFile} /> `;
      if (i === array.length - 1) final += '\n';
      return final;
    }, '\n');
  }
  getClass() {
    return `${this.component.name}`;
  }
  getStyle() {
    if (!this.component.props) return;
    const style = this.component.props.style;
    return JSON.stringify(style);
  }

  getProps() {
    const props = Object.assign({}, this.component.props);
    delete props.style;
    return Object.keys(props).reduce((final, key) => {
      final += `${key}="${props[key]}" `;
      return final;
    }, '');
  }
  generateCode() {
    return (
`
import React, { Component } from 'react'
${this.getImports()}
const divStyle = ${this.getStyle()}
class ${this.getClass()} extends Component { 
  constructor(props){
    super(props)
  }
  render(){
  <div style={divStyle} ${this.getProps()}>${this.getChildren()}
  </div>
  }
}
export default ${this.getClass()}
`
    );
  }
}
class WorkspaceConverter {
  constructor(components) {
    const childcomps = Object.assign({}, components);
    delete childcomps.workspace;
    this.components = this.convertChildIDtoFileName(childcomps);
  }
  convertChildIDtoFileName(components) {
    const converted = Object.keys(components).reduce((acc, id) => {
      const newComponent = Object.assign({}, components[id]);
      newComponent.childrenFileNames = components[id].children.map(childID => padName(components[childID].name, components[childID].id.toString()));
      acc[id] = newComponent;
      return acc;
    }, {});
    return converted;
  }
  convert() {
    return Object.keys(this.components).reduce((acc, key) => {
      const cc = new ComponentConverter(this.components[key]);
      acc.push({
        name: cc.name,
        id: cc.id,
        fileName: cc.fileName,
        ext: cc.ext,
        code: cc.generateCode() });
      return acc;
    }, []);
  }
}
module.exports = WorkspaceConverter;
