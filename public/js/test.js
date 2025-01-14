/*jshint esversion: 6 */

const FormFX = function() {

  if (!Element.prototype.matches) Element.prototype.matches = Element.prototype.msMatchesSelector;
  if (!Element.prototype.closest) Element.prototype.closest = function(selector) {
    var el = this;
    while (el) {
      if (el.matches(selector)) {
        return el;
      }
      el = el.parentElement;
    }
  };

  if ('NodeList' in window && !NodeList.prototype.forEach) {
    console.info('polyfill for IE11');
    NodeList.prototype.forEach = function(callback, thisArg) {
      thisArg = thisArg || window;
      for (var i = 0; i < this.length; i++) {
        callback.call(thisArg, this[i], i, this);
      }
    };
  }

//   const worktypeRadio = document.querySelector("fieldset.section-typeofwork .inputlist.radio");
//   worktypeRadio.addEventListener("click", handleFieldsetVisibility);

//   const specialRadioText = document.querySelector(".special.radio-text input[type='text']");
//   specialRadioText.addEventListener("focus", forceRadioCheck);
//   specialRadioText.addEventListener("blur", validateSpecialRadio);
//   const specialRadioCheckbox = document.querySelector(".special.radio-text input[type='radio']");
//   specialRadioCheckbox.addEventListener("change", focusSpecialText);

  // const formsBody = document.querySelector(".main");
  
  
//   const response = [
//     {
//         "caption": "",
//         "id": 3091,
//         "originalname": "andrew-porter-04-phandy-2021-weaponsmith-c.jpg",
//         "source_url": "https://coopereoys2021.wpengine.com/wp-content/uploads/2021/04/andrew-porter-04-phandy-2021-weaponsmith-c-scaled.jpg",
//         "thumbnail": {
//             "file": "andrew-porter-04-phandy-2021-weaponsmith-c-150x150.jpg",
//             "height": 150,
//             "mime_type": "image/jpeg",
//             "source_url": "https://coopereoys2021.wpengine.com/wp-content/uploads/2021/04/andrew-porter-04-phandy-2021-weaponsmith-c-150x150.jpg",
//             "width": 150
//         }
//     },
//     {
//         "caption": "",
//         "id": 3091,
//         "originalname": "andrew-porter-04-phandy-2021-weaponsmith-c.jpg",
//         "source_url": "https://coopereoys2021.wpengine.com/wp-content/uploads/2021/04/andrew-porter-04-phandy-2021-weaponsmith-c-scaled.jpg",
//         "thumbnail": {
//             "file": "andrew-porter-04-phandy-2021-weaponsmith-c-150x150.jpg",
//             "height": 150,
//             "mime_type": "image/jpeg",
//             "source_url": "https://coopereoys2021.wpengine.com/wp-content/uploads/2021/04/andrew-porter-04-phandy-2021-weaponsmith-c-150x150.jpg",
//             "width": 150
//         }
//     }
// ];
  
  const formsForm = document.querySelector("form");
  const submitButton = document.querySelector("button.submit");
  submitButton.addEventListener("click", validateAndSubmit);

  const allInputs = document.querySelectorAll(".formblock .form-input input, .formblock .form-input textarea");
  allInputs.forEach(function(thisInput, currentIndex) {
    // thisInput.addEventListener("change", validateAllInputs);
    if (thisInput.type === "checkbox") {
      thisInput.addEventListener("change", toggleCheckTag);
    }

    if (thisInput.hasAttribute('list')) {
      thisInput.addEventListener("change", handleDatalist);
    }

    if (thisInput.type === "file") {
      const inputBlock = thisInput.closest(".form-input"), 
            promptClear = inputBlock.querySelector("button.clear"),
            clearAll = inputBlock.querySelector(".clearall"),
            uploadIt = inputBlock.querySelector(".uploadit"),
            promptList = inputBlock.querySelector(".promptlist"),
            summaryInput = inputBlock.closest(".formblock").querySelector(":scope > .form-input");

      inputBlock.classList.add("has-advanced-upload"); // designating the file-select inputs for drag-and-drop decoration
      
      function handleFileOperation(e) {
        if (typeof e === 'undefined') { // Should this ever occur?
          // fileOutput.textContent = "";
          promptList.innerHTML = "";
          return false;
        }
        // let inputFiles = {};
        if (e.dataTransfer) { // Are we being passed a (drag and drop) FileList?
          thisInput.value = "";
          thisInput.submittedFiles = e.dataTransfer.files;
          // if (!thisInput.matches('[data-destination="external"]')) { // Excluding the Vimeo uploader file from submission
          //   allDroppedFiles[thisInput.id] = e.dataTransfer.files;
          // }
          // validateAllInputs();
        } else {
          thisInput.submittedFiles = thisInput.files;
        }
        clearAll.disabled = thisInput.submittedFiles.length > 0 ? false: true;
        uploadIt.textContent = thisInput.submittedFiles.length === 1 ? "Upload it" : "Upload them";
        promptList.innerHTML = `
          ${[...thisInput.submittedFiles].map((item, i) => `
            <dt class="filethumb"><img class="genthumb"></dt>
            <dd class="filemeta" data-required="required"><span class="pseudolabel">Alt text:</span><input type="text" class="alttextfield" placeholder="Description of ${item.name}"></dd>`.trim()).join('')}
        `;
        
        [...thisInput.submittedFiles].forEach(function (file, i) {
          let reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onloadend = function() {
            promptList.querySelectorAll("img.genthumb")[i].src = reader.result;
          }
          
          promptList.querySelectorAll(".filemeta")[i].addEventListener("change", validateAltText);
        });
        uploadIt.disabled = true;
        if (thisInput.submittedFiles.length > 0) {
          inputBlock.classList.add("populated");
          inputBlock.querySelector(".success-message small").textContent = "Your " + (thisInput.submittedFiles.length === 1 ? "file has" : "files have") + " been submitted.";
        }
      }
      
      function validateAltText() {
        let validCount = true;
        promptList.querySelectorAll(".alttextfield").forEach(function(alttextinput) {
          if (alttextinput.value.length === 0) {
            validCount = false;
          };
        });
        if (validCount) {
          uploadIt.disabled = false;
        } else {
          uploadIt.disabled = true;
        }
      }

      // function updateFileCount() {
      //   if (thisInput.submittedFiles.length > 0) {
      //     // thisInput.dataset.filecount = thisInput.submittedFiles.length;
      //     inputBlock.classList.add("populated");
      //   } else {
      //     clearfileInputSelections();
      //   }
      // }
      
      function clearInput(e) {
        e.preventDefault();
        e.stopPropagation();
        // delete allDroppedFiles[thisInput.id];
        clearfileInputSelections();
        notifyChange(thisInput); // The input's change event does not fire when changed programmatically
      }
      
      function notifyChange(inputObj) {
        const evt = new Event("change");
        inputObj.dispatchEvent(evt);
      }
                  
      async function uploadToWordpress(e) {
        e.preventDefault();
        clearAll.disabled = true;
        uploadIt.disabled = true;
        uploadIt.textContent = "Uploading…";
        promptList.classList.add("uploading");
        promptList.querySelectorAll(".alttextfield").forEach(function(textfield) {
          textfield.readOnly = true;
        });
        
        let formData = new FormData();

        let alttext = [];
        for (let i = 0; i < thisInput.submittedFiles.length; i++) {
          formData.append(thisInput.submittedFiles[i].name, thisInput.submittedFiles[i]);
          alttext.push(promptList.querySelectorAll(".alttextfield")[i].value);
        }
        formData.append("alt_text", JSON.stringify(alttext));
        
        const response = await fetch("/wp/imageArray", {
          method: "POST",
          body: formData
        }).then(post => post.json())
        // document.querySelector("code").innerHTML = JSON.stringify(response, null, "\t");
        resolveFromWordpress(response);
      }
      
      function resolveFromWordpress(response) {
        clearfileInputSelections();
        inputBlock.classList.add("success");
        summaryInput.querySelector(".summary-list").innerHTML = `
          <ul class="response-files">
            ${response.map(metadata => `
              <li class="response-file" data-id="${metadata.id}" data-thumb="${metadata.thumbnail.source_url}">${metadata.originalname}</li>
          `).join("\n")}
          </ul>
        `;
        summaryInput.classList.add("generated");
        summaryInput.querySelector("input[type='hidden']").value = JSON.stringify(response.map(item => item['id']));
      }
      
      function clearfileInputSelections() {
        promptList.innerHTML = "";
        promptList.classList.remove("uploading");
        // thisInput.dataset.filecount = 0;
        inputBlock.classList.remove("populated");
        thisInput.submittedFiles = {};
        thisInput.value = "";
      }

      ["drag",
        "dragstart",
        "dragend",
        "dragover",
        "dragenter",
        "dragleave",
        "drop"].forEach(function(event) {
        inputBlock.addEventListener(event, function(e) {
          // preventing the unwanted behaviours
          e.preventDefault();
          e.stopPropagation();
        });
      });
      ["dragover", "dragenter"].forEach(function(event) {
        inputBlock.addEventListener(event, function() {
          inputBlock.classList.add("is-dragover");
        });
      });
      ["dragleave", "dragend", "drop"].forEach(function(event) {
        inputBlock.addEventListener(event, function() {
          inputBlock.classList.remove("is-dragover");
        });
      });
      inputBlock.addEventListener("drop", handleFileOperation);

      thisInput.addEventListener("change", handleFileOperation);
      uploadIt.addEventListener("click", uploadToWordpress);
      clearAll.addEventListener("click", clearfileInputSelections);

      // promptClear.addEventListener("click", clearInput);
    }
  });

  const validationMsg = document.querySelector(".validation-message");

  function scrollToInvalidAnchor() {
    const targetAnchor = this.dataset.anchortarget;
    document.querySelector(`.formblock .titlelabel[data-anchor = "${targetAnchor}"], .formblock .pseudolabel[data-anchor = "${targetAnchor}"]`).scrollIntoView({
      behavior: 'smooth'
    });
  }
  
  function toggleCheckTag(e) {
    const checkTag = this.closest("li");
    if (this.checked) {
      checkTag.classList.add("checked");
    } else {
      checkTag.classList.remove("checked");
    }
  }
  
  function handleDatalist() {
    const checkList = this.closest(".formblock").querySelector(".inputlist.checkboxes");
    if ([...this.list.options].map(option => option.value).includes(this.value)) {
      const newLi = document.createElement("li");
      newLi.innerHTML = `<label><input type="checkbox" name="${checkList.dataset.name}" value="${this.value}" checked="checked">${this.value}</label>`;
      newLi.addEventListener("change", removeLi);
      checkList.appendChild(newLi);
      this.value = "";
    }
    function removeLi() {
      // console.log(this);
      checkList.removeChild(this);
    }
  }

	async function validateAndSubmit(e) {
		e.preventDefault();
    const formData = new FormData(formsForm);
    // Display the values
    for (var entry of formData.entries()) {
       console.log(entry); 
    }
    const response = await fetch("/wp/formData", {
				method: "POST",
				body: formData
			});
			const json = await response.json();
			handleSubmissionResponse(json);
  }

  function handleSubmissionResponse(json) {
    console.log(json);
    const resultsLink = document.createElement('h5');
    resultsLink.innerHTML = `You can view the results of your submission <a href="https://eoys-uploader-2021.glitch.me/wp/post/${json.id}">here</a>.`;
    document.querySelector("footer").appendChild(resultsLink);
  } 

  function isValid(thisInput) {
    let isValid = true;
    switch (thisInput.dataset.inputtype) {
    case "radio":
      const numRadioed = thisInput.querySelectorAll(".inputlist input[type='radio']:checked").length;
      if (numRadioed === 0) {
        isValid = false;
      }
      break;

    case "checkboxes":
      const numChecked = thisInput.querySelectorAll(".inputlist input[type='checkbox']:checked").length;
      if (numChecked === 0) {
        isValid = false;
      }
      break;


    case "textarea":
      const textareaFilled = thisInput.querySelector("textarea").value.length;
      if (textareaFilled === 0) {
        isValid = false;
      }
      break;

    case "datalist":
      const numGenerated = thisInput.querySelectorAll(".inputlist input[type='checkbox']:checked").length;
        console.log(numGenerated);
      if (numGenerated === 0) {
        isValid = false;
      }

      break;

    default:
      const inputFilled = thisInput.querySelector("input").value.length;
      if (inputFilled === 0) {
        isValid = false;
      }
    }
    return isValid;
  }
};

window.addEventListener('DOMContentLoaded', function() {
  new FormFX;
});

