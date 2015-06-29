var Handlebars = require('handlebars');

class MessageResource {
}

class MessageInterpolatorContext {
    constructor(descriptor, validatedValue, messageParameters) {
        this.descriptor = descriptor;
        this.validatedValue = validatedValue;
        this.messageParameters = messageParameters;
    }
}

class MessageInterpolator {
    interpolate(messageTemplate, context) {}
}

class HandlebarsMessageInterpolator extends MessageInterpolator {
    interpolate(messageTemplate, context) {
        let template = Handlebars.compile(messageTemplate);
        return template(context.messageParameters);
    }
}

class ConstraintDescriptor {
    constructor(validatorClass, annotation) {
        this.annotation = annotation;
        this.validatorClass = validatorClass;
        this.attributes = Object.assign({}, annotation);
    }

    get messageTemplate() {
        return this.attributes['message'];
    }
}

class PropertyDescriptor {
    constructor(propertyName) {
        this.name = propertyName;
        this.constraintDescriptors = [];
    }

    addConstraintDescriptor(constraintDescriptor) {
        this.constraintDescriptors.push(constraintDescriptor);
    }
}

class BeanDescriptor {
    constructor(beanClass) {
        this.beanClass = beanClass;
        this.propertyDescriptors = {};
    }

    addConstraintForProperty(propertyName, constraintDescriptor) {
        let propertyDescriptor = this.propertyDescriptors[propertyName];
        if (!propertyDescriptor) {
            propertyDescriptor = new PropertyDescriptor(propertyName);
            this.propertyDescriptors[propertyName] = propertyDescriptor;
        }
        propertyDescriptor.addConstraintDescriptor(constraintDescriptor);
    }

    getConstraintsForProperty(propertyName) {
    }

    getConstrainedProperties() {
        return Object
            .keys(this.propertyDescriptors)
            .map(k => this.propertyDescriptors[k]);
    }
}

class ConstraintValidator {
    initialize(annotation) {
    }

    isValid(value, context) {
        return false;
    }
}

class LengthValidator extends ConstraintValidator {
    constructor() {
        super();
        this.max = Number.MAX_VALUE;
        this.min = 0;
    }

    initialize(annotation) {
        this.max = annotation.max;
        this.min = annotation.min;
    }

    isValid(value, context) {
        return value.length < this.max;
    }
}

class ConstraintValidatorManager {
    constructor() {
        this.cache = {};
    }

    getInitializedValidator(constraintDescriptor) {
        let constraintValidator = new (constraintDescriptor.validatorClass)();
        constraintValidator.initialize(constraintDescriptor.annotation);
        return constraintValidator;
    }
}

class ConstraintViolation {
    constructor(path, constraintDescriptor, interpolatedMessage) {
        this.propertyPath = path;
        this.constraintDescriptor = constraintDescriptor;
        this.interpolatedMessage = interpolatedMessage;
    }

    toString() {
        return interpolatedMessage;
    }
}

class ValidationContext {
    constructor(constraintValidatorManager) {
        this.constraintValidatorManager = constraintValidatorManager;
        this.constraintViolations = [];
    }

    addConstraintViolation(constraintViolation) {
        this.constraintViolations.push(constraintViolation);
    }
}

class ValidatorFactory {
    constructor () {
    }
}

class Validator {
    constructor() {
        this.beanDescriptors = {};
        this.constraintValidatorManager = new ConstraintValidatorManager();
        this.messageInterpolator = new HandlebarsMessageInterpolator();
    }

    validate(bean) {
        let descriptors = {};
        let context = new ValidationContext(this.constraintValidatorManager);

        Object.getOwnPropertyNames(bean.constructor.prototype)
            .forEach(n => {
                descriptors[n] = Object.getOwnPropertyDescriptor(bean.constructor.prototype, n);
            });

        Object.keys(descriptors).filter(function(k) {
            return descriptors[k].get;
        }).forEach(k => bean[k]);

        let beanDescriptor = this.beanDescriptors[bean.constructor.prototype];
        beanDescriptor.getConstrainedProperties().forEach(prop => {
            prop.constraintDescriptors.forEach(cd => {
                let constraintValidator = context.constraintValidatorManager.getInitializedValidator(cd);
                if (!constraintValidator.isValid(bean[prop.name], context)) {
                    let params = Object.assign({}, cd.attributes, {value: bean[prop.name]});
                    let messageInterpolatorContext = new MessageInterpolatorContext(cd, bean[prop.name], params);
                    let interpolatedMessage = this.messageInterpolator.interpolate(cd.messageTemplate, messageInterpolatorContext);
                    context.addConstraintViolation(new ConstraintViolation(prop.name, cd, interpolatedMessage));
                };
            });
        });

        return context.constraintViolations;
    }

    Length(annotation) {
        var defaults = {
            message: '{{max}}以下で入力してください',
            min: 0,
            max: Number.MAX_VALUE
        }
        let validator = this;
        return (target, name, descriptor) => {
            let beanDescriptor = validator.beanDescriptors[target.constructor.prototype];
            if (!beanDescriptor) {
                beanDescriptor = new BeanDescriptor(target.constructor.prototype);
                this.beanDescriptors[target.constructor.prototype] = beanDescriptor;
            }
            Object.keys(defaults).forEach(k => {
                if (!annotation.hasOwnProperty(k)) {
                    annotation[k] = defaults[k];
                }
            });
            beanDescriptor.addConstraintForProperty(name, new ConstraintDescriptor(LengthValidator, annotation));
        };
    }

    Domain(value) {
        return function(target, name, descriptor) {
            //descriptor._validateSpec[name] = value;
        };
    }
}
export default {
    Validator: Validator
};
