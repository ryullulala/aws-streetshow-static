///////////////////////////////////////////////////////////////////////////////////////////////
//////////////////// 지도 //////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////

let mapContainer = document.getElementById("map"), // 지도를 표시할 div
  mapOption = {
    center: new kakao.maps.LatLng(35.15895408992333, 129.1603503221663), // 지도의 중심좌표
    level: 9, // 지도의 확대 레벨
  };

// 지도 객체 생성
let map = new kakao.maps.Map(mapContainer, mapOption);

///////////////////////////////////////////////////////////////////////////////////////////////
//////////////////// 마커 //////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
let currentLocMarker; // 현재 위치 또는 클릭했을 때 표시되는 마커

function displayDBMarker(latLng) {
  return new kakao.maps.Marker({
    map: map,
    position: latLng,
  });
}

function displayCurrentLocMarker(latLng) {
  currentLocMarker = new kakao.maps.Marker({
    map: map,
    position: latLng,
  });
}

///////////////////////////////////////////////////////////////////////////////////////////////
//////////////////// 로드뷰 /////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////

let rvContainer = document.getElementById("roadview"); //로드뷰를 표시할 div
let rv = new kakao.maps.Roadview(rvContainer); //로드뷰 객체
let rvClient = new kakao.maps.RoadviewClient(); //좌표로부터 로드뷰 파노ID를 가져올 로드뷰 helper객체

// 지도의 중심좌표와 가까운 로드뷰의 panoId를 추출하여 로드뷰를 띄운다.
function displayRoadView(mapCenter) {
  rvClient.getNearestPanoId(mapCenter, 50, function (panoId) {
    rv.setPanoId(panoId, mapCenter); //panoId와 중심좌표를 통해 로드뷰 실행
  });
}
// 로드뷰 업데이트
displayRoadView(mapOption.center);

kakao.maps.event.addListener(rv, "init", function () {
  displayRoadViewOverlay();
  //rvCustomOverlay.setAltitude(2); //커스텀 오버레이의 고도값을 설정합니다.(로드뷰 화면 중앙이 0입니다)
  var projection = rv.getProjection(); // viewpoint(화면좌표)값을 추출할 수 있는 projection 객체를 가져옵니다.

  // 커스텀오버레이의 position과 altitude값을 통해 viewpoint값(화면좌표)를 추출합니다.
  var viewpoint = projection.viewpointFromCoords(
    rvCustomOverlay.getPosition(),
    rvCustomOverlay.getAltitude()
  );

  rv.setViewpoint(viewpoint); //커스텀 오버레이를 로드뷰의 가운데에 오도록 로드뷰의 시점을 변화 시킵니다.
});

// 로드뷰 시점 변경 시 지도 업데이트
kakao.maps.event.addListener(rv, "panoid_changed", function () {
  //마커 위치 업데이트
  if (currentLocMarker != undefined) {
    currentLocMarker.setPosition(rv.getPosition());
  }
  //오버레이 위치 업데이트
  if (currentLocOverlay != undefined) {
    currentLocOverlay.setPosition(rv.getPosition());
  }
  //맵 위치 업데이트
  map.setCenter(rv.getPosition());
});

///////////////////////////////////////////////////////////////////////////////////////////////
//////////////////// 오버레이 ///////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
// 커스텀 오버레이에 표출될 내용으로 HTML 문자열이나 document element가 가능합니다
let currentLocOverlay;
let dbLocOverlay;
let currentLocOverlayContent;

function displayOverlay(latLng, content) {
  // 커스텀 오버레이를 생성합니다
  return new kakao.maps.CustomOverlay({
    map: map,
    position: latLng,
    content: content,
    yAnchor: 0,
  });
}

///////////////////////////////////////////////////////////////////////////////////////////////
//////////////////// 로드뷰 오버레이 //////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
let rvCustomOverlay;
function displayRoadViewOverlay(position, content) {
  // 커스텀 오버레이를 생성합니다
  rvCustomOverlay = new kakao.maps.CustomOverlay({
    map: rv,
    position: position,
    content: content,
    xAnchor: 0, // 커스텀 오버레이의 x축 위치입니다. 1에 가까울수록 왼쪽에 위치합니다. 기본값은 0.5 입니다
    yAnchor: 0, // 커스텀 오버레이의 y축 위치입니다. 1에 가까울수록 위쪽에 위치합니다. 기본값은 0.5 입니다
  });
}

///////////////////////////////////////////////////////////////////////////////////////////////
//////////////////// GPS //////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
let lat, lng;
if (navigator.geolocation) {
  // GeoLocation을 이용해서 접속 위치를 얻어옵니다
  navigator.geolocation.getCurrentPosition(function (position) {
    (lat = position.coords.latitude), // 위도
      (lng = position.coords.longitude); // 경도

    let locPosition = new kakao.maps.LatLng(lat, lng);

    //지도 중심위치 변경
    map.setCenter(locPosition);
    //로드뷰 업데이트
    displayRoadView(locPosition);
    //현재 좌표 마커 생성
    displayCurrentLocMarker(locPosition);
    //오버레이 생성
    currentLocOverlayContent =
      '<div class="customoverlay">' +
      '  <a href="https://map.kakao.com/link/map/11394059" target="_blank">' +
      '    <span class="title">현재위치</span>' +
      "  </a>" +
      "</div>";
    currentLocOverlay = displayOverlay(locPosition, currentLocOverlayContent);
    displayRoadViewOverlay(locPosition, currentLocOverlayContent);
  });
}

///////////////////////////////////////////////////////////////////////////////////////////////
//////////////////// API //////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
let locPosition;
const url =
  "https://mumizv9dve.execute-api.ap-northeast-2.amazonaws.com/default/streetshow-lambda?TableName=streetshow";

fetch(url)
  .then((res) => res.json())
  .then((myJson) => {
    //console.log(JSON.stringify(myJson, null, 1));
    const items = myJson.Items;
    for (let i = 0; i < items.length; i++) {
      // db에 저장되어 있는 좌표로 마커 생성
      locPosition = new kakao.maps.LatLng(items[i]["lat"], items[i]["lng"]);
      let title = items[i]["title"];

      let dbOverlayContent =
        '<div class="customoverlay">' +
        '  <a href="" target="_blank">' +
        '    <span class="title">' +
        "[" +
        items[i]["type"] +
        "] " +
        title +
        "</span>" +
        "  </a>" +
        "</div>";

      // 마커 생성
      displayDBMarker(locPosition);
      // 맵 오버레이 생성
      dbLocOverlay = displayOverlay(locPosition, dbOverlayContent);
      // 로드뷰 오버레이 생성
      displayRoadViewOverlay(locPosition, dbOverlayContent);
    }
  });

///////////////////////////////////////////////////////////////////////////////////////////////
//////////////////// 지도 클릭 이벤트//////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////

kakao.maps.event.addListener(map, "click", function (mouseEvent) {
  let latLng = mouseEvent.latLng;
  lat = latLng.getLat(); // 유저가 선택한 위도 값을 변수에 저장
  lng = latLng.getLng(); // 유저가 선택한 경도 값을 변수에 저장
  //마커 위치 업데이트
  currentLocMarker.setPosition(latLng);
  //맵 위치 업데이트
  map.setCenter(latLng);
  //로드뷰 업데이트
  displayRoadView(latLng);

  //오버레이 업데이트
  currentLocOverlay.setPosition(latLng);
});
