var app = angular.module('app', ['ngVis'])

    .service('ajaxService', ['$http', '$q',
        function($http, $q) {

            this.getData = function(url) {
                var deferred = $q.defer();
                $http.get(url, {
                        timeout: 20000
                    })
                    .then(function(out) {
                        deferred.resolve(out.data);
                    }, function(msg, code) {

                        deferred.reject(msg);
                        if (!msg) {
                            msg = 'Failed to load response data'
                        }
                        //$log.error(msg, code);
                        console.log(msg);
                    });
                return deferred.promise;
            }


        }
    ]);

app.controller('MainCtrl', ['$scope', 'VisDataSet', 'ajaxService', '$q',

    function($scope, VisDataSet, ajaxService, $q) {
        $scope.data = null;
        $scope.zoomIn = false;

        var network;


        $scope.getStatus = function() {
            return $scope.updateStatus;
        };

        $scope.resetView = function() {
            $scope.zoomIn = false;
            $("#zout").hide();
            $("#zin").show();
            network.fit();
        };

        $scope.resetData = function() {
            if (network !== null) {
                network.destroy();
                network = null;
                $scope.data = null;
                document.getElementById('sim-status').innerHTML='';
            }
            readFromFile('topo.json');
        }

        $scope.getNetworkData = function() {
            document.getElementById('sim-status').innerHTML='Simulation started, please wait...';
            readFromFile('topo2.json');
        };

        function readFromFile(url) {
            ajaxService.getData(url)
                .then(function(data) {
                    if (!$scope.data) {
                        drawTopo(convertData(data));
                    } else {
                        updateTopo(data);

                    }
                }, function(e) {

                });

        }
        readFromFile('topo.json');

        function convertData(topoData) {
            for (var i in topoData.nodes) {
                var node = topoData.nodes[i];
                _.merge(topoData.nodes[i], {
                    label: node.name + '\n(' + node['ip-addr'].split(',').length + ')'
                });
                _.merge(topoData.nodes[i], {
                    title: 'Name:<br>' + node.name + '<br>Version:<br>' +
                        node.version + '<br>IP:<br>' + node['ip-addr'].split(',').join('<br>')
                });
                _.merge(topoData.nodes[i], {
                    shape: 'box',
                    color: 'lightblue'
                });
            }

            //setting edge color
            for (var i in topoData.edges) {
                if (topoData.edges[i].link == 'UP') {
                    _.merge(topoData.edges[i], {
                        color: 'green'
                    });
                } else {
                    _.merge(topoData.edges[i], {
                        color: 'red'
                    });
                }
            }
            return topoData;
        }

        function updateTopo(topoData) {

            for (var i = 0; i < topoData.edges.length; i++) {
                (function(ind) {
                    setTimeout(function() {
                        if (!topoData.edges[ind]) {
                            return;
                        }
                        if (topoData.edges[ind].link == 'UP') {
                            _.merge(topoData.edges[ind], {
                                color: 'green'
                            });
                        } else {
                            var to = topoData.edges[ind]['to'],
                                from = topoData.edges[ind]['from'];
                            _.merge(topoData.edges[ind], {
                                width: 5,
                                color: 'red'
                            });
                        }

                        $scope.data.edges.update(topoData.edges[ind]);
                        if (ind == topoData.edges.length-1) {
                            document.getElementById('sim-status').innerHTML='Simulation complete.';
                        }

                    }, (100 * ind/ getRandInc(1,3)));
                })(i);
            }

        }

        function drawTopo(topoData) {
            for (var i in topoData.nodes) {
                _.merge(topoData.nodes[i], {
                    shape: 'box',
                    color: 'lightblue'
                });
            }

            //setting edge color
            for (var i in topoData.edges) {
                if (topoData.edges[i].link == 'UP') {
                    _.merge(topoData.edges[i], {
                        color: 'green'
                    });
                } else {
                    _.merge(topoData.edges[i], {
                        color: 'red'
                    });
                }
            }

            // create an array with nodes
            var nodes = new vis.DataSet(topoData.nodes);

            // create an array with edges
            var edges = new vis.DataSet(topoData.edges);
            // create a network
            var container = document.getElementById('mynetwork');
            var data = {
                nodes: nodes,
                edges: edges
            };
            $scope.data = data;


            var options = {
                layout: {
                    randomSeed: 2
                },
                interaction: {
                    dragNodes: true
                },
                physics: {
                    stabilization: false
                },
                manipulation: {
                    enabled: false
                },
                "edges": {
                    "smooth": false
                }
            };


            network = new vis.Network(container, $scope.data, options);
            network.stabilize();
            network.on("stabilizationIterationsDone", function() {
                network.setOptions({
                    physics: false
                });
            });


            network.once("beforeDrawing", function() {
                network.hide();
            });
            network.once("afterDrawing", function() {
                network.fit({
                    animation: {
                        duration: 3000,
                        easingFunction: 'linear'
                    }
                });
            });

            network.on("click", function(params) {
                $("#zout").hide();
                $("#zin").show();
                var nodeId = parseInt(params.nodes[0]);
                focusNode(nodeId);
            }.bind($scope));

            network.on("showPopup", function(params) {

            });
            network.on("hidePopup", function(params) {
                //network.fit();
            });

        }

        function focusNode(nodeId) {
            // updateValues();

            var options = {
                scale: 0.8,
                duration: 1000,
                easingFunction: 'linear'
            }


            network.focus(nodeId, options);
        }

        function getRandInc(min, max) {
            min = Math.ceil(min);
            max = Math.floor(max);
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }

    }
]);