var fs = require('fs');
var _ = require('lodash');

const FILE_NAME = 'topo.json',
    FILE_NAME_2 = 'topo2.json',
    NODE_NUM = 100,  //number of nodes/devices
    EDGES_NUM = 100, //number of links
    DOWN_LINKS = 20; //number of links that will be down for network simulation


var data = {},
    nodesArr = [],
    edgesArr = [],
    linksAvail = {}; //tracking link used

//constructing nodes array
for (var i = 0; i < NODE_NUM; i++) {
    var ipAddr = [],
        ipNum = getRandInc(1, 3); //ip addresses is between 1 and 3
    for (var j = 0; j < ipNum; j++) {
        ipAddr.push(getIP());
    }
    var nodeId = i + 1,
        display = 'Device' + nodeId,
        version = '1.2.' + getRandInc(0, 3); //version can be
    var node = {
        id: nodeId,
        name: display,
        version: version,
        ips: ipAddr
    };

    linksAvail[node.id] = ipNum;
    nodesArr.push(node);
}

//constructing edges array
for (var i = 0; i < EDGES_NUM; i++) {
    var node = nodesArr[i],
        curId = node.id,
        ips = node.ips;
    //get random target for node
    for (var j = 0; j < linksAvail[curId]; j++) {
        //find a random target
        var targetId = getTargetID(curId, linksAvail);
        if (targetId > 0) {
            linksAvail[curId]--;
            linksAvail[targetId]--;
            var edge = {
                from: curId,
                link: 'UP',
                to: targetId
            };
            edgesArr.push(edge);

        }

    }

}

function getTargetID(exclude, linksAvail) {
    var targetId = 0;

    do {

        targetId = getRandInc(1, NODE_NUM);
        if ((targetId != exclude) && (linksAvail[targetId] > 0)) { //check if target node still has available lilnk
            break;
        }
    }
    while (true);


    return targetId;
}


//remove ip from nodes array, visjs cannot take array
for (var i in nodesArr) {
    nodesArr[i]['ip-addr'] = nodesArr[i].ips.join(',');
    delete nodesArr[i].ips;
}


data = {
    nodes: nodesArr,
    edges: edgesArr
};

//now writes the discovery data to a file
write2File(FILE_NAME, data);

for (var i = 0; i < DOWN_LINKS; i++) {
    //setting links to DOWN state for network simulation
    var indx = getRandInc(1, data.edges.length);
    data.edges[indx - 1]['link'] = 'DOWN';
}
//writes 2nd set of update data to a file
write2File(FILE_NAME_2, data);


function write2File(filename, data) {
    fs.writeFile(filename, JSON.stringify(data, null, 4), function(err) {
        if (err) throw err;
        console.log('complete writing:' + filename);
    });
}

//random number generator
function getRandInc(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

//generating random IP addresses
function getIP() {
    return '192.168.' + getRandInc(0, 255) + '.' + getRandInc(0, 255);
}