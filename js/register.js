function registerShow() {
  let today = new Date();

  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      TableName: "streetshow",
      Item: {
        id: today,
        type: document.getElementById("showType").value,
        title: document.getElementById("text").value,
        lat: lat,
        lng: lng,
        date: today.toLocaleDateString(),
      },
    }),
  })
    .then((res) => {
      return res.json();
    })
    .then((data) => {
      console.log(data);
    });
}
