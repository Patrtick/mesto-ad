import { changeLikeCardStatus } from "./api.js";
export const likeCard = (likeButton, cardId, cardData, userId) => {
  const isLiked = likeButton.classList.contains("card__like-button_is-active");
  const likeCountElement = likeButton.nextElementSibling;

  changeLikeCardStatus(cardId, isLiked)
    .then((updatedCard) => {
      likeButton.classList.toggle("card__like-button_is-active", !isLiked);

      if (likeCountElement) {
        likeCountElement.textContent = updatedCard.likes.length;
      }
    })
    .catch((err) => {
      console.error("Ошибка при изменении статуса лайка:", err);
      likeButton.classList.toggle("card__like-button_is-active", isLiked);
    });
};

const getTemplate = () => {
  return document
    .getElementById("card-template")
    .content.querySelector(".card")
    .cloneNode(true);
};

export const createCardElement = (
  cardData,
  userId,
  { onPreviewPicture, onLikeIcon, onDeleteCard }
) => {
  const cardElement = getTemplate();

  const likeButton = cardElement.querySelector(".card__like-button");
  const deleteButton = cardElement.querySelector(".card__control-button_type_delete");
  const cardImage = cardElement.querySelector(".card__image");
  const cardTitle = cardElement.querySelector(".card__title");
  const likeCountElement = cardElement.querySelector(".card__like-count"); // раскомментируйте в HTML!

  cardImage.src = cardData.link;
  cardImage.alt = cardData.name;
  cardTitle.textContent = cardData.name;

  if (likeCountElement) {
    likeCountElement.textContent = cardData.likes.length;
  }

  const userHasLiked = cardData.likes.includes(userId);
  if (userHasLiked) {
    likeButton.classList.add("card__like-button_is-active");
  }

  if (cardData.owner._id !== userId) {
    deleteButton.remove();
  } else {
    deleteButton.addEventListener("click", () => {
      onDeleteCard(cardData._id, cardElement);
    });
  }

  if (onLikeIcon) {
    likeButton.addEventListener("click", () =>
      onLikeIcon(likeButton, cardData._id, cardData, userId)
    );
  }

  if (onPreviewPicture) {
    cardImage.addEventListener("click", () =>
      onPreviewPicture({ name: cardData.name, link: cardData.link })
    );
  }

  return cardElement;
};

export const deleteCard = (cardElement) => {
  cardElement.remove();
};
