smurAngular.run(function(SocketService, StoreProvider, $rootScope, $http, ClientID, Command, localStorage) {

	var handleCommand = function(command, callback) {
		command.status = "new";
		Command.save(command);
		localStorage.setItem("LAST_CMD", command.date);

		console.log(command);

		var data = command.data;
		var storeName = data.entity;
		var store = StoreProvider.getStoreByName(storeName);
		if(!store) {
			console.log("Unknown entity");
		} else {
			var action = command.data.type;
			
			if(action == "delete") {
				store.remove(command.data.id).then(function(){
					$rootScope.$broadcast('dataChanged');
					if(callback)
						callback();
				});
			} else {
				store.get(data.id).then(function(localData){
					if(!localData) {
						localData = {};
						localData.id = data.id;
					}

					var changeArray = data.changes;

					changeArray.forEach(function(element){
						localData[element.attribute] = element.new_val;
					});

					store.save(localData).then(function(){
						$rootScope.$broadcast('dataChanged');
						if(callback)
							callback();
					});
				});
			}
		}
	};

	var lastCmd = localStorage.getItem("LAST_CMD");
	var getParams = "";
	if(lastCmd) 
		getParams = '?{"date": {"$gt":' + lastCmd +'}}';
	
	$http.get('http://localhost:2403/commands'+getParams).success(function(commands) {
		var recursiveFn = function(count, array) {
			if(count >= array.length)
				return;

			var command = array[count];
			handleCommand(command, function() {
				recursiveFn(++count, array)
			});
		};

		recursiveFn(0, commands);
	});

	SocketService.on('commands:new', function(command) {
		localStorage.setItem("LAST_CMD", command.date);

		if(command.origin == ClientID.get())
			return;

		handleCommand(command);
	});
});
