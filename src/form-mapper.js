class ModelProvider {
    newInstance(id) {
        return null;
    }
}

class LocalModelProvider extends ModelProvider {
    constructor() {
        super();
        this.cache = {};
    }
    
    newInstance(id) {
        let modelClass = this.cache[id];
        return new modelClass();
    }
}


class FormMapper {
    constructor(selector, schema) {
        this.schema = schema;
        this.form = document.querySelector(selector);
        this.modelProvider = new LocalModelProvider();
    }

    createBeanCascade(f, schema, prefix = '') {
        let bean = this.modelProvider.newInstance(schema.id || schema.$ref);

        for (var propertyKey in schema.properties) {
            let key = prefix + propertyKey;
            let type = schema.properties[propertyKey].type;

            if (type === 'object') {
                bean[propertyKey] = createBeanCascade(f, schema.properties[propertyKey], key + '.');
            } else if (type === 'array') {
                bean[propertyKey] = [];
                var elements = Array.prototype.slice.apply(f.querySelectorAll('[name^=' + key + ']'))
                    .filter(el => el.getAttribute('name').match(key + '[(\d*)]'))
                    .forEach(el => {
                        bean[propertyKey].push(createBeanCascade(
                            f, schema.properties[propertyKey], el.getAttribute('name') + '.'));
                    });
            } else {
                let el = f.querySelector('[name=' + key + ']');
                bean[propertyKey] = el.value;
            }
        }

        return bean;
    }

    createBean() {
        return this.createBeanCascade(this.form, this.schema);
    }
}

export default FormMapper;
