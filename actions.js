'use strict';

const assign = require('object-assign');
const command = require('selenium-webdriver/lib/command');
const webdriver = require('selenium-webdriver');

const ActionSequence = webdriver.ActionSequence;
const Button = webdriver.Button;
const Key = webdriver.Key;

const fn = {

  exec(script) {
    const args = Array.prototype.slice.call(arguments, 1);
    const cmd = new command.Command(command.Name.EXECUTE_SCRIPT);
    cmd.setParameter('script', script);
    cmd.setParameter('args', args);
    this.schedule_('exec', cmd);
    return this;
  },

  keyDown(key) {
    const code = Key[key.toUpperCase()] || key;
    return ActionSequence.keyDown.call(this, code);
  },

  keyUp(key) {
    const code = Key[key.toUpperCase()] || key;
    return ActionSequence.keyUp.call(this, code);
  },

  click(element, button) {
    if (arguments.length == 1) {
      button = element;
      element = null;
    }
    if (typeof button == 'string') button = Button[button.toUpperCase()];
    return ActionSequence.click.call(this, element, button);
  }
};

function actions(driver) {
  return assign(Object.create(new ActionSequence(driver)), fn);
}

module.exports = actions;
