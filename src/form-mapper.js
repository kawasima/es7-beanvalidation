class FormMapper {
    constrctor(selector) {
        this.form = document.querySelector(selector);
    }

    bind(beanClass) {
        let bean = new beanClass();
    }
}
