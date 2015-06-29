# JavascriptでBeanValidationを実装してみる

## ValidationTargetのBean

```javascript
class {
  @validators.Length({max: 8})
  get name() {
  }
}
```

BeanValidationと同じくアノテーション、に見えるDecoratorをつける。

## BeanのValidation

```javascript
var formMapper = new FormMapper("#form1");

var person = formMapper.bind(Person);
Validator validator = validatorFactory.getValidator();
var violations = validator.validate(person);
```

## ValidatorFactoryの初期化

`Validation.buildDefaultValidatorFactory()`
