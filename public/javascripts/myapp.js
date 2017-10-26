app = angular.module("MyApp", ['ngRoute']);

// all environments
app.config(['$routeProvider',
    function($routeProvider) {
     
        $routeProvider.
                when('/HOME', {
                    templateUrl: 'view/home.html',
                    controller: 'HomeCtrl'
                }).
                otherwise({
                    redirectTo: '/HOME'
                });
               
    }]);

app.controller("HomeCtrl", function($http, $scope) {
$http.get("/data/test").success(function(data){
  
                $scope.data = data.data;
            
        }).error(function(data) {
            console.log(data);
        });;

});
