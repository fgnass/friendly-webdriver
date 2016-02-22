var assign = require('object-assign');
var command = require('selenium-webdriver/lib/command');
var webdriver = require('selenium-webdriver');

var ActionSequence = webdriver.ActionSequence;
var Button = webdriver.Button;
var Key = webdriver.Key;

var fn = {

  exec: function (script) {
    var args = Array.prototype.slice.call(arguments, 1);
    var cmd = new command.Command(command.Name.EXECUTE_SCRIPT);
    cmd.setParameter('script', script);
    cmd.setParameter('args', args);
    this.schedule_('exec', cmd);
    return this;
  },

  keyDown: function (key) {
    var code = Key[key.toUpperCase()] || key;
    return ActionSequence.keyDown.call(this, code);
  },

  keyUp: function (key) {
    var code = Key[key.toUpperCase()] || key;
    return ActionSequence.keyUp.call(this, code);
  },

  click: function (element, button) {
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
