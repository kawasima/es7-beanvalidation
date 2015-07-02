import FormMapper from '../../src/form-mapper';
import BeanValidation from '../../src/bean';
import fs from 'fs';
import jsdom from 'jsdom';

describe('form mapper test', () => {
    let validator = new BeanValidation.Validator();
    
    class Person {
        constructor() {
            this.name = null;
            this.address = [];
        }

        @validator.Valid
        get family() {
            return this._family;
        }

        set family(family) {
            this._family = family;
        }
    }

    jsdom.env({
        html: fs.readFileSync('test/unit/test.html', 'UTF-8'),
        done: function(errors, window) {
            global.document = window.document;
            var form = window.document.querySelector('#form1');
            var mapper = new FormMapper('#form1', {id: "Person", properties: {name: {type: "string"}}});
            mapper.modelProvider.cache["Person"] = Person;
            var bean = mapper.createBean();
            console.log(bean);
        }
    });

});

