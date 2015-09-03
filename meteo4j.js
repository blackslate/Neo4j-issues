
var queries = {
  "roomsForNewDoors": {
    collection: Meteor.neo4j.collection("RoomsForNewDoors")
  , query: 
     "MATCH (entrance:Room), (exit:Room) " +
     "WHERE NOT (entrance)-[:DOOR]->(exit) " +
     "AND entrance <> exit " +
     "RETURN entrance" // "RETURN DISTINCT entrance" fails silently
  , link: "entrance"
  }
, "newDoorsForRoom": {
    collection: Meteor.neo4j.collection("NewDoorsForRoom")
  , query: 
      "MATCH (entrance:Room), (exit:Room) " +
      "WHERE entrance.name = {name} " +
      "AND NOT (entrance)-[:DOOR]->(exit) " +
      "AND entrance <> exit " +
      "RETURN exit"
  , options: {name: "Room 2"}
  , link: "exit"
  }
}


if (Meteor.isServer) {
  ;(function (){
    var queryKeys = Object.keys(queries)
    queryKeys.forEach(publish)

    function publish(key) {
      var queryData = queries[key]
      var query = queryData.query
      var collection = queryData.collection

      collection.publish(key, publishCallback)

      function publishCallback(){
        return query
      }
    }
  })()
}


if (Meteor.isClient) {
  Tracker.autorun(function createSubscriptions(){
    var queryKeys = Object.keys(queries)
    queryKeys.forEach(subscribe)

    function subscribe(key) { //, index, array){
      var queryData = queries[key]
      var options = queryData.options
      var link = queryData.link
      var collection = queryData.collection
      var subscription = collection.subscribe(key, options, link)
    }
  })

  function getResults(queryData) {
    var collection = queryData.collection
    var cursor = collection.find()
    return cursor
  }

  Template.addDoor.events({
    'change #fromRoomName': function () {
      var fromRoomId = $("#fromRoomName :selected").text()
      Session.set("fromRoomId", fromRoomId)
    }
  })

  Template.addDoor.helpers({
    fromRooms: function() {
      var results = getResults(queries.roomsForNewDoors)
      return results
    }

  , toRooms: function () {
      var key = "newDoorsForRoom"
      var queryData = queries[key]
      var options = { name: Session.get("fromRoomId") }
      var link = queryData.link
      var collection = queryData.collection
      collection.subscribe(key, options, link)

      var results = getResults(queryData)
      return results
    }
  })
}
