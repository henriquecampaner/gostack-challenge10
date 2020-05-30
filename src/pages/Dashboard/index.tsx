/* eslint-disable no-alert */
import React, { useState, useEffect } from 'react';
import * as Yup from 'yup';

import Header from '../../components/Header';

import api from '../../services/api';

import Food from '../../components/Food';
import ModalAddFood from '../../components/ModalAddFood';
import ModalEditFood from '../../components/ModalEditFood';

import { FoodsContainer } from './styles';

interface IFoodPlate {
  id: number;
  name: string;
  image: string;
  price: string;
  description: string;
  available: boolean;
}

const Dashboard: React.FC = () => {
  const [foods, setFoods] = useState<IFoodPlate[]>([]);
  const [editingFood, setEditingFood] = useState<IFoodPlate>({} as IFoodPlate);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  useEffect(() => {
    async function loadFoods(): Promise<void> {
      const { data } = await api.get<IFoodPlate[]>('/foods');

      const foodsAvailable = data.filter(food => food.available === true);

      setFoods(foodsAvailable);
    }

    loadFoods();
  }, []);

  async function handleAddFood(
    food: Omit<IFoodPlate, 'id' | 'available'>,
  ): Promise<void> {
    try {
      const schema = Yup.object().shape({
        name: Yup.string().required('Field name is required'),
        price: Yup.number().required('Field price is required'),
        description: Yup.string().required('Field description is required'),
        image: Yup.string()
          .matches(
            /^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,}))\.?)(?::\d{2,5})?(?:[/?#]\S*)?$/i,
            'Enter correct url!',
          )
          .required('Please enter website'),
      });

      await schema.validate(food, {
        abortEarly: false,
      });

      const newFood = {
        ...food,
        available: true,
      };

      const response = await api.post('/foods', newFood);

      setFoods(oldState => [...oldState, response.data]);
    } catch (err) {
      // eslint-disable-next-line no-alert
      alert(err);
    }
  }

  async function handleUpdateFood(
    food: Omit<IFoodPlate, 'id' | 'available'>,
  ): Promise<void> {
    try {
      const editedFood = {
        ...food,
        id: editingFood.id,
        available: editingFood.available,
      };

      const response = await api.put(`/foods/${editingFood.id}`, editedFood);

      setFoods(state => {
        return state.map(foodState => {
          if (foodState.id === editingFood.id) {
            return { ...response.data };
          }
          return foodState;
        });
      });
    } catch (error) {
      alert(error);
    }
  }

  async function handleUpdateAvailability(food: IFoodPlate): Promise<void> {
    try {
      const response = await api.patch(`/foods/${food.id}`, {
        available: !food.available,
      });

      setFoods(state => {
        return state.map(foodState => {
          if (foodState.id === editingFood.id) {
            return { ...response.data };
          }
          return foodState;
        });
      });
      // eslint-disable-next-line no-empty
    } catch (error) {}
  }

  async function handleDeleteFood(id: number): Promise<void> {
    try {
      await api.delete(`/foods/${id}`);

      const filterFoods = foods.filter(food => food.id !== id);

      setFoods(filterFoods);
    } catch (error) {
      alert(error);
    }
  }

  function toggleModal(): void {
    setModalOpen(!modalOpen);
  }

  function toggleEditModal(): void {
    setEditModalOpen(!editModalOpen);
  }

  function handleEditFood(food: IFoodPlate): void {
    setEditModalOpen(!editModalOpen);
    setEditingFood(food);
  }

  return (
    <>
      <Header openModal={toggleModal} />
      <ModalAddFood
        isOpen={modalOpen}
        setIsOpen={toggleModal}
        handleAddFood={handleAddFood}
      />
      <ModalEditFood
        isOpen={editModalOpen}
        setIsOpen={toggleEditModal}
        editingFood={editingFood}
        handleUpdateFood={handleUpdateFood}
      />

      <FoodsContainer data-testid="foods-list">
        {foods &&
          foods.map(food => (
            <Food
              key={food.id}
              food={food}
              handleDelete={handleDeleteFood}
              handleEditFood={handleEditFood}
              handleUpdateAvailability={handleUpdateAvailability}
            />
          ))}
      </FoodsContainer>
    </>
  );
};

export default Dashboard;
