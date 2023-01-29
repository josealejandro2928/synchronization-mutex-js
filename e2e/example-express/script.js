
async function incrementViews(id = 1, end = "view") {
  let data = await fetch(`http://localhost:8888/websites/${id}/${end}/`)
  data = await data.json();
  return data;
}

function main() {
  let start = performance.now();
  // let type = "view";
  let type = "view_mutex";
  Promise.all([
    incrementViews(1, type),
    incrementViews(1, type),
    incrementViews(1, type),
    incrementViews(2, type),
    incrementViews(2, type),
    incrementViews(2, type)
  ]).then((res) => {
    console.log(res);
    console.log("Delay: ", performance.now() - start, "ms");

  }).catch(console.log)

}

main()
