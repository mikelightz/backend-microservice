const form = document.getElementById("form");

form.addEventListener("submit", submitForm);

function submitForm(e) {
  e.preventDefault();
  const files = document.getElementById("inputfield");
  const formData = new FormData();
  for (let i = 0; i < files.files.length; i++) {
    formData.append("files", files.files[i]);
  }

  fetch("htttp://localhost:3000/api/fileanalyse", {
    method: "POST",
    body: formData,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  })
    .then((res) => console.log(res))
    .catch((err) => ("Error occured", err));
}
