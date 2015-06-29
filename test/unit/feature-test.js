import BeanValidation from '../../src/bean';

describe('test', () => {
    describe('validates', () => {
        it('should be true', () => {
            let validator = new BeanValidation.Validator();
            class Person {
                @validator.Length({max: 8})
                get name() {
                    return this._name;
                }

                set name(name) {
                    this._name = name;
                }
            }

            let person = new Person();
            person.name = 'hogejoadsfi';

            let violations = validator.validate(person);
            expect(violations).to.have.length(1);
        });

    });

});
