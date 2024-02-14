import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  TextInput,
  Platform,
  ScrollView,
  FlatList,
} from "react-native";
import { Calendar } from "react-native-calendars";
import * as SQLite from "expo-sqlite";

interface RenderDayComponentProps {
  date: {
    dateString: string;
    day: number;
    month: number;
    year: number;
    timestamp: number;
  };
}

function openDatabase() {
  if (Platform.OS === "web") {
    return {
      transaction: () => {
        return {
          executeSql: () => {},
        };
      },
    };
  }

  const db = SQLite.openDatabase("db.db");
  return db;
}

const db = openDatabase();

function Items({ done: doneHeading, onPressItem }) {
  const [items, setItems] = React.useState(null);

  React.useEffect(() => {
    db.transaction((tx) => {
      tx.executeSql(
        `select * from items where done = ?;`,
        [doneHeading ? 1 : 0],
        (_, { rows: { _array } }) => setItems(_array)
      );
    });
  }, []);

  const heading = doneHeading ? "Completed" : "Todo";

  if (items === null || items.length === 0) {
    return null;
  }

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionHeading}>{heading}</Text>
      {items.map(({ id, done, value }) => (
        <TouchableOpacity
          key={id}
          onPress={() => onPressItem && onPressItem(id)}
          style={{
            backgroundColor: done ? "#1c9963" : "#fff",
            borderColor: "#000",
            borderWidth: 1,
            padding: 8,
          }}
        >
          <Text style={{ color: done ? "#fff" : "#000" }}>{value}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function useForceUpdate() {
  const [value, setValue] = React.useState(0);
  return [() => setValue(value + 1), value];
}

export default function App() {
  const [selectedDate, setSelectedDate] = React.useState<string>("2024-02-15");
  const [text, setText] = React.useState(null);
  const [forceUpdate, forceUpdateId] = useForceUpdate();

  const [items, setItems] = React.useState(null);
  console.log("items", items);

  React.useEffect(() => {
    db.transaction((tx) => {
      tx.executeSql("SELECT * FROM items", [], (txObj, { rows }) => {
        const itemsArray = rows._array;
        setItems(itemsArray);
      });
    });
  }, []);

  useEffect(() => {
    db.transaction((tx) => {
      tx.executeSql(
        "create table if not exists items (id integer primary key not null, done int, value text);"
      );
    });
  }, []);

  const add = (text: SQLite.SQLStatementArg) => {
    // is text empty?
    if (text === null || text === "") {
      return false;
    }

    db.transaction(
      (tx) => {
        tx.executeSql("insert into items (done, value) values (0, ?)", [text]);
        tx.executeSql("select * from items", [], (_, { rows }) => {
          console.log(JSON.stringify(rows));
          const itemsArray = rows._array;
          setItems(itemsArray);
        });
      },
      null,
      forceUpdate
    );
  };

  const data = [
    {
      id: "1",
      emoji: "😊",
      date: "2024-02-14",
      note: "Sample Note 1",
    },
    {
      id: "2",
      emoji: "🎉",
      date: "2024-02-27",
      note: "Sample Note 2",
    },
    {
      id: "3",
      emoji: "🥳",
      date: "2024-02-28",
      note: "Sample Note 3",
    },
  ];

  const renderDayComponent: React.FC<RenderDayComponentProps | any> = ({
    date,
  }) => {
    const currentDate = date?.dateString;
    const selected = selectedDate === currentDate;
    const item = data.find((d) => d.date === currentDate);

    return (
      <TouchableOpacity
        key={currentDate}
        onPress={() => {
          console.log("Pressed", currentDate);
          setSelectedDate(currentDate);
        }}
        style={{
          height: 50,
          width: 50,
          borderRadius: 25,
          backgroundColor: selected ? "#ddd" : "white",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {item ? (
          <>
            <Text>{item.emoji}</Text>
            <Text style={{ fontWeight: "bold", fontSize: 12 }}>
              {date?.day}
            </Text>
          </>
        ) : (
          <Text>{date?.day}</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={{ flexDirection: "column", flex: 1 }}>
        <View
          style={{
            flex: 0.8,
            justifyContent: "center",
          }}
        >
          <Calendar dayComponent={renderDayComponent} />
        </View>
        <View>
          <FlatList
            horizontal
            data={items}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={(id) => {
                  console.log("Pressed", id);

                  db.transaction(
                    (tx) => {
                      tx.executeSql(
                        "DELETE FROM items WHERE id = ?;",
                        [id],
                        (_, results) => {
                          // Handle success if needed
                          console.log("Item deleted successfully");
                        }
                      );
                    },
                    // Error callback
                    (error) => {
                      console.error("Error deleting item:", error);
                    },
                    // Success callback or forceUpdate
                    forceUpdate
                  );
                }}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: 10,
                  backgroundColor: item.done ? "#1c9963" : "#fff",
                  borderColor: "#000",
                  borderWidth: 1,
                  margin: 10,
                }}
              >
                <Text>{item.value}</Text>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id}
          />
        </View>

        {/* <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.listArea}
        >
          <Items
            key={`forceupdate-todo-${forceUpdateId}`}
            done={false}
            onPressItem={(id) =>
              db.transaction(
                (tx) => {
                  tx.executeSql(`update items set done = 1 where id = ?;`, [
                    id,
                  ]);
                },
                null,
                forceUpdate
              )
            }
          /> */}
        {/* <Items
            done
            key={`forceupdate-done-${forceUpdateId}`}
            onPressItem={(id) =>
              db.transaction(
                (tx) => {
                  tx.executeSql(`delete from items where id = ?;`, [id]);
                },
                null,
                forceUpdate
              )
            }
          /> */}
        {/* </ScrollView> */}

        <View
          style={{
            justifyContent: "center",
            flex: 0.2,
          }}
        >
          <View style={{ flex: 1 }}>
            <TextInput
              onChangeText={(text) => setText(text)}
              onSubmitEditing={() => {
                add(text);
                setText(null);
              }}
              placeholder="How are you feeling today?"
              value={text}
              style={{
                height: 40,
                borderWidth: 1,
                borderRadius: 10,
                borderColor: "gray",
                padding: 10,
              }}
            />
          </View>
        </View>
      </View>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,

    backgroundColor: "#fff",
  },
  heading: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
  listArea: {
    backgroundColor: "#f0f0f0",
    flex: 1,
    paddingTop: 16,
  },
  sectionContainer: {
    marginBottom: 16,
    marginHorizontal: 16,
  },
  sectionHeading: {
    fontSize: 18,
    marginBottom: 8,
  },
});
