import { createCardElement, deleteCard, likeCard } from "./components/card.js";
import { openModalWindow, closeModalWindow, setCloseModalWindowEventListeners } from "./components/modal.js";
import { enableValidation, clearValidation } from "./components/validation.js";
import { getUserInfo, getCardList, setUserInfo, setUserAvatar, createCard, removeCard, changeLikeCardStatus } from "./components/api.js";

const placesWrap = document.querySelector(".places__list");
const profileFormModalWindow = document.querySelector(".popup_type_edit");
const profileForm = profileFormModalWindow.querySelector(".popup__form");
const profileTitleInput = profileForm.querySelector(".popup__input_type_name");
const profileDescriptionInput = profileForm.querySelector(".popup__input_type_description");
let currentUserId;
const cardFormModalWindow = document.querySelector(".popup_type_new-card");
const cardForm = cardFormModalWindow.querySelector(".popup__form");
const cardNameInput = cardForm.querySelector(".popup__input_type_card-name");
const cardLinkInput = cardForm.querySelector(".popup__input_type_url");

const imageModalWindow = document.querySelector(".popup_type_image");
const imageElement = imageModalWindow.querySelector(".popup__image");
const imageCaption = imageModalWindow.querySelector(".popup__caption");

const openProfileFormButton = document.querySelector(".profile__edit-button");
const openCardFormButton = document.querySelector(".profile__add-button");

const profileTitle = document.querySelector(".profile__title");
const profileDescription = document.querySelector(".profile__description");
const profileAvatar = document.querySelector(".profile__image");

const avatarFormModalWindow = document.querySelector(".popup_type_edit-avatar");
const avatarForm = avatarFormModalWindow.querySelector(".popup__form");
const avatarInput = avatarForm.querySelector(".popup__input");

const usersStatsModalWindow = document.querySelector(".popup_type_info");
const usersStatsModalInfoList = usersStatsModalWindow.querySelector(".popup__info");
const usersStatsModalUserList = usersStatsModalWindow.querySelector(".popup__list");

const infoDefinitionTemplate = document.querySelector("#popup-info-definition-template");
const userPreviewTemplate = document.querySelector("#popup-info-user-preview-template");

const handlePreviewPicture = ({ name, link }) => {
  imageElement.src = link;
  imageElement.alt = name;
  imageCaption.textContent = name;
  openModalWindow(imageModalWindow);
};

const handleProfileFormSubmit = (evt) => {
  evt.preventDefault();
  const submitButton = profileForm.querySelector(".popup__button");
  const originalText = submitButton.textContent;
  submitButton.textContent = "Сохранение...";

  setUserInfo({
    name: profileTitleInput.value,
    about: profileDescriptionInput.value,
  })
    .then((userData) => {
      profileTitle.textContent = userData.name;
      profileDescription.textContent = userData.about;
      closeModalWindow(profileFormModalWindow);
    })
    .catch((err) => {
      console.log(err);
    })
    .finally(() => {
      submitButton.textContent = originalText;
    });
};

const handleAvatarFromSubmit = (evt) => {
  evt.preventDefault();
  const submitButton = avatarForm.querySelector(".popup__button");
  const originalText = submitButton.textContent;
  submitButton.textContent = "Сохранение...";
  
  setUserAvatar({
    avatar: avatarInput.value,
  })
    .then((userData) => {
      profileAvatar.style.backgroundImage = `url(${userData.avatar})`;
      submitButton.textContent = originalText;
      closeModalWindow(avatarFormModalWindow);
    })
    .catch((err) => {
      closeModalWindow(avatarFormModalWindow);
      submitButton.textContent = originalText;
      console.log(err);
    });
};

const handleCardFormSubmit = (evt) => {
  evt.preventDefault();
  const submitButton = cardForm.querySelector(".popup__button");
  const originalText = submitButton.textContent;
  submitButton.textContent = "Создание...";

  createCard({
    name: cardNameInput.value,
    link: cardLinkInput.value,
  })
    .then((cardData) => {
      placesWrap.prepend(
        createCardElement(
          cardData,
          currentUserId,
          {
            onPreviewPicture: handlePreviewPicture,
            onLikeIcon: likeCard,
            onDeleteCard: deleteCard,
          }
        )
      );
      closeModalWindow(cardFormModalWindow);
      cardForm.reset();
    })
    .catch((err) => {
      console.log(err);
    })
    .finally(() => {
      submitButton.textContent = originalText;
    });
};

const handleDeleteCard = (cardId, cardElement) => {
  removeCard(cardId)
    .then(() => {
      cardElement.remove();
    })
    .catch((err) => {
      console.log(err);
    });
};

const formatDate = (date) =>
  date.toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const createInfoString = (termText, descriptionText) => {
  const itemElement = infoDefinitionTemplate.content.querySelector(".popup__info-item").cloneNode(true);
  itemElement.querySelector(".popup__info-term").textContent = termText;
  itemElement.querySelector(".popup__info-description").textContent = descriptionText;
  return itemElement;
};

const handleLogoClick = () => {
  getCardList()
    .then((cards) => {
      usersStatsModalInfoList.innerHTML = "";
      usersStatsModalUserList.innerHTML = "";

      if (cards.length === 0) {
        usersStatsModalInfoList.append(createInfoString("Карточек нет", "—"));
        openModalWindow(usersStatsModalWindow);
        return;
      }

      const sortedCards = [...cards].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      const firstCard = sortedCards[sortedCards.length - 1];
      const lastCard = sortedCards[0];

      const ownerCounts = {};
      for (const card of cards) {
        if (card.owner && card.owner._id) {
          ownerCounts[card.owner._id] = (ownerCounts[card.owner._id] || 0) + 1;
        }
      }

      const totalUsers = Object.keys(ownerCounts).length;
      const maxCardsByOneUser = Math.max(...Object.values(ownerCounts));

      usersStatsModalInfoList.append(
        createInfoString("Всего карточек:", String(sortedCards.length))
      );

      usersStatsModalInfoList.append(
        createInfoString("Первая создана:", formatDate(new Date(firstCard.createdAt)))
      );

      usersStatsModalInfoList.append(
        createInfoString("Последняя создана:", formatDate(new Date(lastCard.createdAt)))
      );

      usersStatsModalInfoList.append(
        createInfoString("Всего пользователей:", String(totalUsers))
      );
      usersStatsModalInfoList.append(
        createInfoString("Максимум карточек от одного:", String(maxCardsByOneUser))
      );

      const uniqueOwners = [];
      const seenIds = new Set();
      for (const card of sortedCards) {
        if (card.owner && !seenIds.has(card.owner._id)) {
          seenIds.add(card.owner._id);
          uniqueOwners.push(card.owner);
        }
      }

      if (uniqueOwners.length > 0) {
        uniqueOwners.forEach(owner => {
          const userItem = document.createElement("li");
          userItem.className = "popup__list-item popup__list-item_type_badge";
          userItem.textContent = owner.name || "Без имени";
          usersStatsModalUserList.append(userItem);
        });
      } else {
        usersStatsModalUserList.innerHTML = "<li class='popup__list-item'>Нет данных</li>";
      }

      openModalWindow(usersStatsModalWindow);
    })
    .catch((err) => {
      console.error("Ошибка при загрузке карточек:", err);
    });
};

profileForm.addEventListener("submit", handleProfileFormSubmit);
cardForm.addEventListener("submit", handleCardFormSubmit);
avatarForm.addEventListener("submit", handleAvatarFromSubmit);

openProfileFormButton.addEventListener("click", () => {
  profileTitleInput.value = profileTitle.textContent;
  profileDescriptionInput.value = profileDescription.textContent;
  clearValidation(profileForm, validationSettings);
  openModalWindow(profileFormModalWindow);
});

profileAvatar.addEventListener("click", () => {
  clearValidation(avatarForm, validationSettings);
  openModalWindow(avatarFormModalWindow);
});

openCardFormButton.addEventListener("click", () => {
  clearValidation(cardForm, validationSettings);
  openModalWindow(cardFormModalWindow);
});

const allPopups = document.querySelectorAll(".popup");
allPopups.forEach((popup) => {
  setCloseModalWindowEventListeners(popup);
});

const validationSettings = {
  formSelector: ".popup__form",
  inputSelector: ".popup__input",
  submitButtonSelector: ".popup__button",
  inactiveButtonClass: "popup__button_disabled",
  inputErrorClass: "popup__input_type_error",
  errorClass: "popup__error_visible",
};

enableValidation(validationSettings);

Promise.all([getCardList(), getUserInfo()])
  .then(([cards, userData]) => {
    currentUserId = userData._id;
    profileTitle.textContent = userData.name || 'Имя не указано';
    profileDescription.textContent = userData.about || 'Описание отсутствует';
    if (userData.avatar) {
      profileAvatar.style.backgroundImage = `url(${userData.avatar})`;
    }

    cards.forEach((card) => {
      placesWrap.append(
        createCardElement(card, currentUserId, {
          onPreviewPicture: handlePreviewPicture,
          onLikeIcon: likeCard,
          onDeleteCard: handleDeleteCard,
        })
      );
    });
  })
  .catch(err => {
    console.error("Ошибка загрузки данных:", err);
  });

const logo = document.querySelector(".logo");
logo.addEventListener("click", handleLogoClick);