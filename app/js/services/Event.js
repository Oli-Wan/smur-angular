
smurAngular.factory("Event", function Event($timeout, $q, $rootScope){
	var storeWrapper = {
		ready:false,
		setReady: function() {
			this.ready = true;
		},
		getStore: function() {
			return $timeout(waitForStore);
		},
		store: new IDBStore({
			dbVersion: 2,
			storeName: 'event',
			keyPath: 'id',
			autoIncrement: true,
			onStoreReady: function() {
				storeWrapper.setReady();
			},
			indexes: [
			{ name: "missionId" }
			]
		}),
		getByMissionId: function(missionId){
			var id = parseInt(missionId);
			var deferred = $q.defer();
			storeWrapper.getStore().then(function(store){
				var keyRange = store.makeKeyRange({
					lower: id,
					upper: id
				});
				store.query(function(data) {
					$rootScope.$apply(function(){
						deferred.resolve(data);
					});
				}, {
					"index":"missionId",
					"keyRange":keyRange
				});
			});
			return deferred.promise;
		}
	};

	function waitForStore() {
		if(storeWrapper.ready) {
			return storeWrapper.store;
		}
		else {
			return $timeout(waitForStore, 100);
		}
	}
	return storeWrapper;
});