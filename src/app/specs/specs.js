angular.module( 'orderCloud' )

    .config( SpecsConfig )
    .controller( 'SpecsCtrl', SpecsController )
    .controller( 'SpecEditCtrl', SpecEditController )
    .controller( 'SpecCreateCtrl', SpecCreateController )
    .controller( 'SpecAssignCtrl', SpecAssignController )

;

function SpecsConfig( $stateProvider ) {
    $stateProvider
        .state( 'base.specs', {
            url: '/specs',
            templateUrl:'specs/templates/specs.tpl.html',
            controller:'SpecsCtrl',
            controllerAs: 'specs',
            data: {componentName: 'Specs'},
            resolve: {
                SpecList: function(Specs) {
                    return Specs.List();
                }
            }
        })
        .state( 'base.specEdit', {
            url: '/specs/:specid/edit',
            templateUrl:'specs/templates/specEdit.tpl.html',
            controller:'SpecEditCtrl',
            controllerAs: 'specEdit',
            resolve: {
                SelectedSpec: function($stateParams, Specs) {
                    return Specs.Get($stateParams.specid);
                }
            }
        })
        .state( 'base.specCreate', {
            url: '/specs/create',
            templateUrl:'specs/templates/specCreate.tpl.html',
            controller:'SpecCreateCtrl',
            controllerAs: 'specCreate'
        })
        .state('base.specAssign', {
            url: '/specs/:specid/assign',
            templateUrl: 'specs/templates/specAssign.tpl.html',
            controller: 'SpecAssignCtrl',
            controllerAs: 'specAssign',
            resolve: {
                ProductList: function (Products) {
                    return Products.List(null, 1, 20);
                },
                Assignments: function ($stateParams, Specs) {
                    return Specs.ListAssignments($stateParams.specid);
                },
                SelectedSpec: function ($stateParams, Specs) {
                    return Specs.Get($stateParams.specid);
                }
            }
        })
}

function SpecsController( SpecList, $state ) {
    var vm = this;
    vm.list = SpecList;

    vm.goToEdit = function(id) {
        $state.go('^.specEdit', {'specid': id});
    };
    vm.goToAssignments = function(id) {
        $state.go('^.specAssign', {'specid': id});
    };
}

function SpecEditController( $state, SelectedSpec, Specs ) {
    var vm = this,
        specid = SelectedSpec.ID;
    vm.specName = SelectedSpec.SpecName;
    vm.spec = SelectedSpec;
    if(vm.spec.MarkupType != null) {
        vm.associateMU = true;
    }
    if(vm.spec.ControlType == 'Selection') {
        vm.spec.IsRadioButtons = vm.spec.IsRadioButtons.toString();
    }



    vm.addSelectionValue = function() {
        vm.spec.Options.push({Value: vm.selectionValue, Markup: vm.selectionMarkup, ListOrder: vm.selectionListOrder})
        vm.selectionValue = null;
        vm.selectionMarkup = null;
    }

    vm.deleteSelectionOption = function($index) {
        vm.spec.Options.splice($index, 1);
    }

    vm.Submit = function() {
        Specs.Update(specid, vm.spec)
            .then(function() {
                $state.go('^.specs')
            });
    };

    vm.Delete = function() {
        Specs.Delete(specid)
            .then(function() {
                $state.go('^.specs')
            });
    }
}

function SpecCreateController($state, Specs) {
    var vm = this;
    vm.spec = {};
    vm.spec.Options = new Array;


    vm.addSelectionValue = function() {
        vm.spec.Options.push({Value: vm.selectionValue, Markup: vm.selectionMarkup, ListOrder: vm.selectionListOrder})
        vm.selectionValue = null;
        vm.selectionMarkup = null;
    }

    vm.deleteSelectionOption = function($index) {
        vm.spec.Options.splice($index, 1);
    }

    vm.Submit = function() {
        Specs.Create(vm.spec)
            .then(function() {
                $state.go('^.specs')
            });
    }
}

function SpecAssignController(ProductList, Assignments, SelectedSpec, Specs) {
    var vm = this;
    vm.list = ProductList;
    vm.assignments = Assignments.Items;
    vm.spec = SelectedSpec;
    setSelected(Assignments, ProductList);

    vm.saveAssignments = function(form) {
        angular.forEach(ProductList.Items, function(product, index) {
            if (form['assignCheckbox' + index].$dirty) {
                if (product.selected) {
                    var toSave = true;
                    angular.forEach(Assignments.Items, function(assignedProduct) {
                        if (assignedProduct.ProductID === product.ID) {
                            toSave = false;
                        }
                    });
                    if (toSave) {
                        Specs.SaveAssignment({SpecID: SelectedSpec.ID, ProductID: product.ID});

                    }
                }
                else {
                    angular.forEach(Assignments.Items, function(assignedProduct, index) {
                        if (assignedProduct.ProductID === product.ID) {
                            Specs.DeleteAssignment(SelectedSpec.ID, product.ID);
                            Assignments.Items.splice(index, 1);
                            index = index - 1;
                        }
                    });
                }
            }
        });
        angular.forEach(Assignments.Items, function(assignedProduct, index) {
            if (!assignedProduct.ProductID) {
                Specs.DeleteAssignment(SelectedSpec.ID, assignedProduct.ID);
                Assignments.Items.splice(index, 1);
                index = index - 1;
            }
        });form.$setPristine(true);
        setSelected(Assignments, ProductList);
    }

    function setSelected(Assignments, ProductList) {
        angular.forEach(ProductList.Items, function(product) {
            angular.forEach(Assignments.Items, function(assignedProduct) {
                if (assignedProduct.ProductID === product.ID) {
                    product.selected = true;
                }
            });
        });
    }
    vm.resetSelections = function(index, form) {
        var matched = false;
        angular.forEach(Assignments.Items, function(assignedProduct) {
            if (assignedProduct.ProductID === ProductList.Items[index].ID) {
                matched = true;
            }
        });
        if (matched && ProductList.Items[index].selected) {
            form['assignCheckbox' + index].$setPristine(true);
        }
        else if (!matched && !ProductList.Items[index].selected) {
            form['assignCheckbox' + index].$setPristine(true);
        }
    }
}