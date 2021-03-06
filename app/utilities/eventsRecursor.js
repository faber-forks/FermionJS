// import { cloneDeep }  from 'lodash';
import cloneDeep from './cloneDeep';
/**
* @param {object} parent - Object being examined
* @param {object} components - workspace.components regardless of first param ID
*/

export function getChildEvents(parent, components) {
  const { children } = parent;
  let events = parent.events || {};
  if (children.length === 0){
    return events;
  }
  children.forEach((child) => {
    events[child] = Object.assign({}, getChildEvents(components[child], components));
  });
  return events;
}

/**
* @param {object} events - workspace events or component events
* @param {string} component - string name of component
* @param {object} components - workspace.components regardless of first param ID
*/

export function flattenEvents(events, component, components, methods) {
  const children = components[component].children;
  const cloneEvents = cloneDeep(events);
  const flatEvents = Object.keys(events).reduce((final, key) => {
    if (children.indexOf(Number(key)) === -1) {
      final[key] = events[key];
    } else {
      const methodEvents = insertMethods(flattenEvents(events[key], key, components, methods), methods);
      final = Object.assign(final, methodEvents);
    }
    return final;
  }, {});
  return insertMethods(flatEvents, methods);
}

/**
* @param {function} insertMethods - used to replace 'onClick' etc with the method it calls in the properties chain, both in the destructuring action and the chain action in a component's parent.
* @param {object} events - events for a given component. may be CHILD or OWN.
* @param {array} methods - methodNames array
*/

export function insertMethods(events, methods) {
  Object.keys(events).forEach((key) => {
    const toTest = events[key].replace(/\((.+?)\)=>/, '').replace(/\((.+?)\) => /, '').replace(/\(()\)=>/, '').replace(/\(()\)/, '').replace(/\((.+?)\)/, '');
    if (methods.indexOf(key) !== -1) return;
    const methName = methods.indexOf(toTest);
    if (methName !== -1) {
      Object.defineProperty(events, methods[methName], Object.getOwnPropertyDescriptor(events, key));
      delete events[key];
    } else {
      delete events[key];
    }
  });
  return events;
}
/**
* @param {function} insertThis - used to insert the 'this' keyword into a passed down method from app.js
* @param {object} events - events for a given component. may be CHILD or OWN.
* @param {array} methods - methodNames array
*/
export function insertThis(events, methods) {
  Object.keys(events).forEach((key) => {
    // const toTest = events[key].split('() => ').join('()=>').split('()=>').join('').replace(/\((.+)\)/, '').split('()').join('');
    const toTest = events[key].replace(/\((.+?)\)=>/, '').replace(/\((.+?)\) => /, '').replace(/\(()\)=>/, '').replace(/\(()\)/, '').replace(/\((.+?)\)/, '');
    const methName = methods.indexOf(toTest);
    if (methName !== -1) {
      const method = methods[methName];
      const newEvent = events[key].split(method).join(`this.${method}`);
      events[key] = newEvent;
    }
  });
  return events;
}
